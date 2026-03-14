import React, { useEffect, useRef } from 'react';
import {
  Animated,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { colors } from '../config/theme';
import type { RecordingState } from '../types';

interface RecordButtonProps {
  state: RecordingState;
  onPressIn: () => void;
  onPressOut: () => void;
}

export default function RecordButton({ state, onPressIn, onPressOut }: RecordButtonProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // 録音中はパルスアニメーション
  useEffect(() => {
    if (state === 'recording') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state, pulseAnim]);

  // 処理中は点滅
  useEffect(() => {
    if (state === 'processing') {
      const blink = Animated.loop(
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      );
      blink.start();
      return () => blink.stop();
    } else {
      opacityAnim.setValue(1);
    }
  }, [state, opacityAnim]);

  const isRecording = state === 'recording';
  const isProcessing = state === 'processing';
  const isDisabled = isProcessing || state === 'done';

  const buttonColor = isRecording ? colors.recording : colors.primary;

  return (
    <Animated.View
      style={[
        styles.outerRing,
        {
          borderColor: buttonColor,
          transform: [{ scale: pulseAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        onPressIn={!isDisabled ? onPressIn : undefined}
        onPressOut={!isDisabled ? onPressOut : undefined}
        disabled={isDisabled}
        activeOpacity={0.85}
      >
        <View style={[styles.button, { backgroundColor: buttonColor }]}>
          <Text style={styles.icon}>
            {isRecording ? '⏹' : isProcessing ? '⏳' : '🎙️'}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  icon: {
    fontSize: 36,
  },
});
