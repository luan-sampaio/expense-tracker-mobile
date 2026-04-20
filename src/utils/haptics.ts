import * as Haptics from 'expo-haptics';

export function impactFeedback() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function successFeedback() {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export function warningFeedback() {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

export function errorFeedback() {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

