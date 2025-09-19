import React from "react";
import { useTheme } from "@/store/adapters/themeAdapter";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const qualityLevels = [
  { id: "low", label: "Low", description: "Basic sound quality" },
  { id: "normal", label: "Normal", description: "Standard sound quality" },
  { id: "high", label: "High", description: "Improved sound quality" },
  { id: "lossless", label: "Lossless", description: "Highest fidelity audio" },
];

export default function SettingsAudioQuality() {
  const { theme } = useTheme();

  const getSetting = (key: string, defaultValue: string) => {
    if (typeof window === "undefined") return defaultValue;
    return localStorage.getItem(key) || defaultValue;
  };

  const setSetting = (key: string, value: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, value);
      window.dispatchEvent(new CustomEvent("settings-updated"));
      toast.success("Audio settings updated!");
    }
  };

  const [wifiQuality, setWifiQuality] = React.useState(() =>
    getSetting("audio_wifi_quality", "high"),
  );
  const [cellularQuality, setCellularQuality] = React.useState(() =>
    getSetting("audio_cellular_quality", "normal"),
  );
  const [normalizeVolume, setNormalizeVolume] = React.useState(
    () => getSetting("audio_normalize_volume", "true") === "true",
  );

  const handleNormalizeChange = (checked: boolean) => {
    setNormalizeVolume(checked);
    setSetting("audio_normalize_volume", String(checked));
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium mb-4 mt-8 text-white">
        Audio Quality
      </h3>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label
              htmlFor="normalize-volume"
              className="font-medium text-white"
            >
              Normalize volume
            </Label>
            <p className="text-sm text-gray-400 mt-1">
              Set the same volume level for all tracks.
            </p>
          </div>
          <Switch
            id="normalize-volume"
            checked={normalizeVolume}
            onCheckedChange={handleNormalizeChange}
          />
        </div>

        <div>
          <Label className="font-medium text-white">WiFi streaming</Label>
          <RadioGroup
            value={wifiQuality}
            onValueChange={(val) => {
              setWifiQuality(val);
              setSetting("audio_wifi_quality", val);
            }}
            className="mt-2 space-y-1"
          >
            {qualityLevels.map((level) => (
              <div
                key={`wifi-${level.id}`}
                className="flex items-center justify-between"
              >
                <Label
                  htmlFor={`wifi-${level.id}`}
                  className="text-sm font-normal text-gray-300"
                >
                  {level.label}
                  <p className="text-xs text-gray-500">{level.description}</p>
                </Label>
                <RadioGroupItem value={level.id} id={`wifi-${level.id}`} />
              </div>
            ))}
          </RadioGroup>
        </div>

        <div>
          <Label className="font-medium text-white">Cellular streaming</Label>
          <RadioGroup
            value={cellularQuality}
            onValueChange={(val) => {
              setCellularQuality(val);
              setSetting("audio_cellular_quality", val);
            }}
            className="mt-2 space-y-1"
          >
            {qualityLevels
              .filter((l) => l.id !== "lossless")
              .map((level) => (
                <div
                  key={`cell-${level.id}`}
                  className="flex items-center justify-between"
                >
                  <Label
                    htmlFor={`cell-${level.id}`}
                    className="text-sm font-normal text-gray-300"
                  >
                    {level.label}
                    <p className="text-xs text-gray-500">{level.description}</p>
                  </Label>
                  <RadioGroupItem value={level.id} id={`cell-${level.id}`} />
                </div>
              ))}
          </RadioGroup>
        </div>
      </div>
    </div>
  );
}
