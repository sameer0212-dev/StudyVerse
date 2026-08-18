import { AppTheme } from '@/constants/theme';
import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  theme: AppTheme;
  minutes?: number;
};

export default function MotivationTimer({
  visible,
  onClose,
  theme,
  minutes = 25,
}: Props) {
  const totalSeconds = minutes * 60;
  const [remaining, setRemaining] = useState(totalSeconds);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!visible) {
      // Reset whenever the modal is reopened fresh.
      setRemaining(totalSeconds);
      setRunning(false);
    }
  }, [visible, totalSeconds]);

  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            setRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const mins = Math.floor(remaining / 60)
    .toString()
    .padStart(2, '0');
  const secs = (remaining % 60).toString().padStart(2, '0');
  const finished = remaining === 0;

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.cardElevated,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.label, { color: theme.colors.textMuted }]}>
            FOCUS RESET
          </Text>

          <Text style={[styles.timer, { color: theme.colors.text }]}>
            {mins}:{secs}
          </Text>

          <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
            {finished
              ? 'Time\'s up. Nice work showing up for it.'
              : running
              ? 'One small block. That\'s all this is.'
              : `A focused ${minutes}-minute block. No pressure, just start.`}
          </Text>

          <View style={styles.actions}>
            {!finished && (
              <Pressable
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
                onPress={() => setRunning((r) => !r)}
              >
                <Text style={styles.buttonText}>
                  {running ? 'PAUSE' : remaining === totalSeconds ? 'START' : 'RESUME'}
                </Text>
              </Pressable>
            )}

            <Pressable
              style={[
                styles.button,
                styles.secondaryButton,
                { borderColor: theme.colors.border },
              ]}
              onPress={() => {
                setRunning(false);
                setRemaining(totalSeconds);
              }}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>
                RESET
              </Text>
            </Pressable>
          </View>

          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeText, { color: theme.colors.textMuted }]}>
              Close
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 2,
    padding: 28,
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  timer: {
    fontSize: 52,
    fontWeight: '900',
    marginTop: 14,
    fontVariant: ['tabular-nums'],
  },
  hint: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 19,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
    width: '100%',
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  closeButton: {
    marginTop: 18,
  },
  closeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
