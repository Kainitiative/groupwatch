import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { Map, Trash2, Plus, Loader2, Save, X, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

// Fix Leaflet default icon issue with webpack/vite
import L from "leaflet";
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface Boundary {
  id: string;
  name: string;
  boundaryType: string;
  geometry: any;
  colour: string;
  bufferMeters: number | null;
  sections: any[];
}

export default function MapBoundaries() {
  const [, params] = useRoute("/g/:slug/map");
  const slug = params?.slug ?? "";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const mapRef = useRef<L.Map | null>(null);
  const drawnLayersRef = useRef<L.FeatureGroup | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [pendingGeometry, setPendingGeometry] = useState<any>(null);
  const [newName, setNewName] = useState("");
  const [newColour, setNewColour] = useState("#10b981");
  const [saving, setSaving] = useState(false);

  const { data: boundaries = [], isLoading } = useQuery<Boundary[]>({
    queryKey: [`/api/groups/${slug}/boundaries`],
    queryFn: async () => {
      const res = await fetch(`/api/groups/${slug}/boundaries`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const deleteBoundary = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/groups/${slug}/boundaries/${id}`, {
        method: "DELETE", credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${slug}/boundaries`] });
      toast({ title: "Boundary removed" });
    },
    onError: () => toast({ title: "Error", description: "Failed to remove boundary", variant: "destructive" }),
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [53.3498, -6.2603], // Default: Dublin
      zoom: 10,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnLayersRef.current = drawnItems;

    // Dynamically import leaflet-draw to avoid SSR issues
    import("leaflet-draw").then(() => {
      const drawControl = new (L as any).Control.Draw({
        draw: {
          polygon: {
            allowIntersection: false,
            shapeOptions: { color: "#10b981", weight: 2 },
          },
          polyline: false,
          rectangle: false,
          circle: false,
          marker: false,
          circlemarker: false,
        },
        edit: {
          featureGroup: drawnItems,
          remove: false,
        },
      });
      map.addControl(drawControl);

      map.on((L as any).Draw.Event.CREATED, (e: any) => {
        const layer = e.layer;
        drawnItems.addLayer(layer);
        const geojson = layer.toGeoJSON();
        setPendingGeometry(geojson.geometry);
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Draw existing boundaries on map
  useEffect(() => {
    if (!mapRef.current || !drawnLayersRef.current) return;

    // Clear existing layers (except drawn)
    mapRef.current.eachLayer((layer: any) => {
      if (layer instanceof L.TileLayer) return;
      if (layer === drawnLayersRef.current) return;
      if (layer instanceof L.FeatureGroup && layer !== drawnLayersRef.current) return;
      mapRef.current?.removeLayer(layer);
    });

    if (boundaries.length === 0) return;

    const allLayers: L.Layer[] = [];
    boundaries.forEach(b => {
      try {
        const layer = L.geoJSON(b.geometry, {
          style: { color: b.colour || "#10b981", weight: 2, fillOpacity: 0.15 },
        });
        layer.bindPopup(`<strong>${b.name}</strong>`);
        layer.addTo(mapRef.current!);
        allLayers.push(layer);
      } catch {}
    });

    if (allLayers.length > 0) {
      // Fit map to boundaries
      try {
        const group = L.featureGroup(allLayers);
        mapRef.current.fitBounds(group.getBounds(), { padding: [40, 40] });
      } catch {}
    }
  }, [boundaries]);

  const handleSave = async () => {
    if (!newName.trim() || !pendingGeometry) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/groups/${slug}/boundaries`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          boundaryType: "polygon",
          geometry: pendingGeometry,
          colour: newColour,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${slug}/boundaries`] });
      setPendingGeometry(null);
      setNewName("");
      drawnLayersRef.current?.clearLayers();
      toast({ title: "Boundary saved" });
    } catch {
      toast({ title: "Error", description: "Failed to save boundary", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SidebarLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Map Boundaries</h1>
          <p className="text-muted-foreground text-sm mt-1">Draw boundaries for your group's area — lakes, parks, reserves, patrol routes</p>
        </div>

        <div className="bg-accent/10 border border-accent/30 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <Info className="w-4 h-4 text-accent mt-0.5 shrink-0" />
          <p className="text-sm text-foreground/80">
            Use the polygon tool on the map to draw a boundary, then name it and save. Boundaries help organise incidents by location and can be used to filter your dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div
                ref={mapContainerRef}
                style={{ height: "500px", width: "100%" }}
              />
            </div>

            {/* Save pending shape */}
            {pendingGeometry && (
              <div className="mt-4 bg-emerald-950/30 border border-emerald-700/40 rounded-2xl p-4">
                <p className="text-sm font-medium text-emerald-400 mb-3">New boundary drawn — give it a name to save</p>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={newColour}
                    onChange={e => setNewColour(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-slate-800 border border-slate-700 shrink-0"
                  />
                  <input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. North Lake, River Section A, Main Park..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    onKeyDown={e => e.key === "Enter" && handleSave()}
                  />
                  <button
                    onClick={handleSave}
                    disabled={saving || !newName.trim()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 shrink-0"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                  </button>
                  <button
                    onClick={() => { setPendingGeometry(null); drawnLayersRef.current?.clearLayers(); }}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Boundary list */}
          <div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-semibold text-white text-sm">Saved Boundaries</h3>
                <span className="text-xs text-slate-500">{boundaries.length} total</span>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                </div>
              ) : boundaries.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <Map className="w-8 h-8 mx-auto mb-3 text-slate-600" />
                  <p className="text-sm text-slate-500">No boundaries yet.</p>
                  <p className="text-xs text-slate-600 mt-1">Use the polygon tool on the map to draw one.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {boundaries.map(b => (
                    <div key={b.id} className="flex items-center gap-3 px-4 py-3.5">
                      <div
                        className="w-4 h-4 rounded-full shrink-0 border-2"
                        style={{ backgroundColor: (b.colour ?? "#10b981") + "33", borderColor: b.colour ?? "#10b981" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{b.name}</p>
                        <p className="text-xs text-slate-500 capitalize">{b.boundaryType.replace("_", " ")}</p>
                      </div>
                      <button
                        onClick={() => { if (confirm(`Remove "${b.name}"?`)) deleteBoundary.mutate(b.id); }}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
