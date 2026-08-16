import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

export default function AuthScreen() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    const sanitizedEmail = email.trim().toLowerCase();

    if (!sanitizedEmail || !password.trim()) {
      Alert.alert('Missing information', 'Please enter your email and password.');
      return;
    }

    try {
      setLoading(true);

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: sanitizedEmail,
          password,
        });

        if (error) throw error;

        console.log('LOGIN SUCCESS');

        router.replace('/(tabs)');
      } else {
        const { error } = await supabase.auth.signUp({
          email: sanitizedEmail,
          password,
        });

        if (error) throw error;

        Alert.alert(
          'Account created!',
          'Check your email to confirm your account.'
        );
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      Alert.alert(
        'Authentication failed',
        error?.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.logo}>StudyVerse</Text>
            <Text style={styles.title}>
              {isLogin ? 'Welcome back' : 'Create your account'}
            </Text>
            <Text style={styles.subtitle}>
              {isLogin
                ? 'Sign in to continue your learning journey.'
                : 'Create an account to save your study materials and progress.'}
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#666671"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#666671"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <Pressable
              style={({ pressed }) => [
                styles.authButton,
                loading && styles.authButtonDisabled,
                pressed && !loading && styles.buttonPressed,
              ]}
              onPress={handleAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0B0B10" />
              ) : (
                <Text style={styles.authButtonText}>
                  {isLogin ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </Pressable>

            <View style={styles.switchContainer}>
              <Text style={styles.switchText}>
                {isLogin
                  ? "Don't have an account?"
                  : 'Already have an account?'}
              </Text>

              <Pressable
                onPress={() => {
                  setIsLogin((prev) => !prev);
                  setPassword('');
                }}
                hitSlop={10}
              >
                <Text style={styles.switchButton}>
                  {isLogin ? ' Sign Up' : ' Sign In'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0B10',
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginBottom: 34,
  },
  logo: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 28,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: '#92929D',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 9,
    maxWidth: 430,
  },
  form: {
    width: '100%',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#15151D',
    borderWidth: 1,
    borderColor: '#292933',
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 14,
  },
  authButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 26,
  },
  authButtonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  authButtonText: {
    color: '#0B0B10',
    fontSize: 14,
    fontWeight: '800',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  switchText: {
    color: '#858590',
    fontSize: 13,
  },
  switchButton: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});