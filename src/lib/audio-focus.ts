export type AudioRole = "cover" | "creator-note";

export type AudioFocusController = {
  pause: () => void;
  stop: () => void;
};

const controllers: Partial<Record<AudioRole, AudioFocusController>> = {};

export function registerAudioFocusController(
  role: AudioRole,
  controller: AudioFocusController,
) {
  controllers[role] = controller;

  return () => {
    if (controllers[role] === controller) {
      delete controllers[role];
    }
  };
}

export function requestAudioFocus(role: AudioRole) {
  if (role === "cover") {
    controllers["creator-note"]?.stop();
    return;
  }

  controllers.cover?.pause();
}

export function pauseAudioRole(role: AudioRole) {
  controllers[role]?.pause();
}
