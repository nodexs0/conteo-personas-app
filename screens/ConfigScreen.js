import React, { useContext } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { ThemeContext } from '../theme/ThemeContext';

export default function ConfigScreen() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.text, { color: theme.text }]}>
        Tema oscuro
      </Text>
      <Switch
        value={theme.mode === 'dark'}
        onValueChange={toggleTheme}
        trackColor={{ false: '#767577', true: '#e91e63' }}
        thumbColor={theme.mode === 'dark' ? '#fff' : '#000'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 18,
    marginBottom: 10,
  },
});
