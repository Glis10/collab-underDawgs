import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { ChatMessage, sendAssistantMessage } from '@/src/lib/chat';

const RED = '#E63946';
const INK = '#172026';
const TRUST = '#0F766E';
const SURFACE = '#FFFFFF';
const SOFT = '#F4F7F8';
const BUTTON_SIZE = 60;
const SCREEN_MARGIN = 14;

type Point = {
  x: number;
  y: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function TypingDots() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [pulse]);

  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });

  return (
    <View style={styles.typingRow}>
      {[0, 1, 2].map((dot) => (
        <Animated.View
          key={dot}
          style={[
            styles.typingDot,
            {
              opacity,
              transform: [{ translateY: pulse.interpolate({ inputRange: [0, 1], outputRange: [0, dot === 1 ? -3 : -1] }) }],
            },
          ]}
        />
      ))}
    </View>
  );
}

export function AiChatAssistant() {
  const { width, height } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const animation = useRef(new Animated.Value(0)).current;
  const dragStartRef = useRef<Point>({ x: 0, y: 0 });
  const buttonPositionRef = useRef<Point>({ x: 0, y: 0 });
  const movedDuringDragRef = useRef(false);
  const lastDragAtRef = useRef(0);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>();
  const [buttonPosition, setButtonPosition] = useState<Point>(() => ({
    x: Math.max(SCREEN_MARGIN, width - BUTTON_SIZE - 18),
    y: Math.max(SCREEN_MARGIN, height - BUTTON_SIZE - 22),
  }));
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'Hi, I am EmerG Assistant. Ask me about emergencies, hospitals, safety steps, or how to use the app.',
      timestamp: new Date().toISOString(),
    },
  ]);

  const panelWidth = Math.min(width - 28, 390);
  const panelHeight = Math.min(height * 0.72, 560);
  const canSend = input.trim().length > 0 && !isLoading;
  const panelLeft = clamp(buttonPosition.x + BUTTON_SIZE - panelWidth, SCREEN_MARGIN, Math.max(SCREEN_MARGIN, width - panelWidth - SCREEN_MARGIN));
  const preferredPanelTop = buttonPosition.y - panelHeight - 14;
  const fallbackPanelTop = buttonPosition.y + BUTTON_SIZE + 14;
  const panelTop = clamp(
    preferredPanelTop >= SCREEN_MARGIN ? preferredPanelTop : fallbackPanelTop,
    SCREEN_MARGIN,
    Math.max(SCREEN_MARGIN, height - panelHeight - SCREEN_MARGIN),
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4,
        onPanResponderGrant: () => {
          movedDuringDragRef.current = false;
          dragStartRef.current = buttonPositionRef.current;
        },
        onPanResponderMove: (_, gestureState) => {
          if (Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4) {
            movedDuringDragRef.current = true;
          }

          const nextPosition = {
            x: clamp(dragStartRef.current.x + gestureState.dx, SCREEN_MARGIN, Math.max(SCREEN_MARGIN, width - BUTTON_SIZE - SCREEN_MARGIN)),
            y: clamp(dragStartRef.current.y + gestureState.dy, SCREEN_MARGIN, Math.max(SCREEN_MARGIN, height - BUTTON_SIZE - SCREEN_MARGIN)),
          };

          buttonPositionRef.current = nextPosition;
          setButtonPosition(nextPosition);
        },
        onPanResponderRelease: () => {
          if (movedDuringDragRef.current) {
            lastDragAtRef.current = Date.now();
            return;
          }

          setIsOpen((current) => !current);
        },
        onPanResponderTerminate: () => {
          if (movedDuringDragRef.current) {
            lastDragAtRef.current = Date.now();
          }
        },
      }),
    [height, width],
  );

  const panelStyle = useMemo(
    () => ({
      opacity: animation,
      transform: [
        {
          translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }),
        },
        {
          scale: animation.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }),
        },
      ],
    }),
    [animation],
  );

  useEffect(() => {
    Animated.timing(animation, {
      toValue: isOpen ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [animation, isOpen]);

  useEffect(() => {
    setButtonPosition((current) => {
      const nextPosition = {
        x: clamp(current.x || width - BUTTON_SIZE - 18, SCREEN_MARGIN, Math.max(SCREEN_MARGIN, width - BUTTON_SIZE - SCREEN_MARGIN)),
        y: clamp(current.y || height - BUTTON_SIZE - 22, SCREEN_MARGIN, Math.max(SCREEN_MARGIN, height - BUTTON_SIZE - SCREEN_MARGIN)),
      };

      buttonPositionRef.current = nextPosition;
      return nextPosition;
    });
  }, [height, width]);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }
  }, [messages, isLoading, isOpen]);

  const handleSend = async () => {
    const trimmedMessage = input.trim();

    if (!trimmedMessage || isLoading) {
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      text: trimmedMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((current) => [...current, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendAssistantMessage(trimmedMessage, conversationId);
      setConversationId(response.conversationId);
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: response.reply,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: error instanceof Error ? error.message : 'EmerG assistant could not respond right now.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View pointerEvents="box-none" style={styles.host}>
      {isOpen ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 18 : 0}
          pointerEvents="box-none"
          style={[styles.keyboardHost, { left: panelLeft, top: panelTop }]}>
          <Animated.View style={[styles.panel, { width: panelWidth, height: panelHeight }, panelStyle]}>
            <View style={styles.header}>
              <View style={styles.headerIcon}>
                <Ionicons name="medical" size={22} color={SURFACE} />
              </View>
              <View style={styles.headerText}>
                <Text numberOfLines={1} style={styles.title}>
                  EmerG Assistant
                </Text>
                <Text numberOfLines={1} style={styles.subtitle}>
                  Emergency help, safety, hospitals, app support
                </Text>
              </View>
              <Pressable accessibilityLabel="Close EmerG assistant" onPress={() => setIsOpen(false)} style={styles.iconButton}>
                <Ionicons name="close" size={22} color={INK} />
              </Pressable>
            </View>

            <ScrollView
              ref={scrollRef}
              contentContainerStyle={styles.messages}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {messages.map((message, index) => {
                const isUser = message.role === 'user';

                return (
                  <View key={`${message.timestamp}-${index}`} style={[styles.messageBlock, isUser && styles.userMessageBlock]}>
                    <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
                      <Text style={[styles.messageText, isUser && styles.userMessageText]}>{message.text}</Text>
                    </View>
                    <Text style={[styles.timestamp, isUser && styles.userTimestamp]}>{formatTime(message.timestamp)}</Text>
                  </View>
                );
              })}
              {isLoading ? (
                <View style={styles.messageBlock}>
                  <View style={[styles.bubble, styles.assistantBubble, styles.loadingBubble]}>
                    <TypingDots />
                  </View>
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.composer}>
              <TextInput
                multiline
                maxLength={1200}
                onChangeText={setInput}
                onSubmitEditing={Platform.OS === 'web' ? handleSend : undefined}
                placeholder="Ask EmerG for help..."
                placeholderTextColor="#7A8A94"
                style={styles.input}
                value={input}
              />
              <Pressable
                accessibilityLabel="Send message"
                disabled={!canSend}
                onPress={handleSend}
                style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}>
                <Ionicons name="send" size={18} color={SURFACE} />
              </Pressable>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      ) : null}

      <Animated.View
        accessibilityLabel={isOpen ? 'Close EmerG assistant' : 'Open EmerG assistant'}
        accessibilityRole="button"
        style={[styles.floatingButton, { left: buttonPosition.x, top: buttonPosition.y }]}
        {...panResponder.panHandlers}>
        <Ionicons name={isOpen ? 'close' : 'chatbubbles'} size={27} color={SURFACE} />
        {!isOpen ? <View style={styles.alertDot} /> : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
  },
  keyboardHost: {
    position: 'absolute',
  },
  panel: {
    backgroundColor: SURFACE,
    borderColor: '#DCE5E8',
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#09212A',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 14,
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#FDFEFE',
    borderBottomColor: '#E7EEF0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  headerIcon: {
    alignItems: 'center',
    backgroundColor: RED,
    borderRadius: 16,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: INK,
    fontSize: 17,
    fontWeight: '800',
  },
  subtitle: {
    color: '#5D6D76',
    fontSize: 12,
    marginTop: 2,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: SOFT,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  messages: {
    padding: 14,
    paddingBottom: 18,
  },
  messageBlock: {
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userMessageBlock: {
    alignItems: 'flex-end',
  },
  bubble: {
    borderRadius: 18,
    maxWidth: '86%',
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  assistantBubble: {
    backgroundColor: SOFT,
    borderBottomLeftRadius: 6,
  },
  userBubble: {
    backgroundColor: TRUST,
    borderBottomRightRadius: 6,
  },
  loadingBubble: {
    minWidth: 58,
  },
  messageText: {
    color: INK,
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: SURFACE,
  },
  timestamp: {
    color: '#7A8A94',
    fontSize: 11,
    marginTop: 4,
  },
  userTimestamp: {
    textAlign: 'right',
  },
  typingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    height: 20,
  },
  typingDot: {
    backgroundColor: TRUST,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  composer: {
    alignItems: 'flex-end',
    backgroundColor: SURFACE,
    borderTopColor: '#E7EEF0',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  input: {
    backgroundColor: SOFT,
    borderColor: '#DCE5E8',
    borderRadius: 18,
    borderWidth: 1,
    color: INK,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    maxHeight: 92,
    minHeight: 42,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: RED,
    borderRadius: 21,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  sendButtonDisabled: {
    backgroundColor: '#A8B4BA',
  },
  floatingButton: {
    alignItems: 'center',
    backgroundColor: RED,
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    position: 'absolute',
    shadowColor: '#7A0F19',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    width: 60,
    elevation: 12,
  },
  alertDot: {
    backgroundColor: TRUST,
    borderColor: SURFACE,
    borderRadius: 7,
    borderWidth: 2,
    height: 14,
    position: 'absolute',
    right: 8,
    top: 8,
    width: 14,
  },
});
