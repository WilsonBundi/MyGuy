import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface MyGuyIconProps {
  size?: number;
}

export default function MyGuyIcon({ size = 60 }: MyGuyIconProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Orange circle background */}
      <View style={[styles.circle, { width: size, height: size }]}>
        {/* "M" letter in white */}
        <Text style={[styles.letter, { fontSize: size * 0.5 }]}>M</Text>
        
        {/* Three dots representing connected people */}
        <View style={styles.dotsContainer}>
          <View style={[styles.dot, styles.dotLeft]} />
          <View style={[styles.dot, styles.dotCenter]} />
          <View style={[styles.dot, styles.dotRight]} />
        </View>
        
        {/* Connection arc */}
        <View style={styles.arc} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    borderRadius: 1000,
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  letter: {
    color: '#ffffff',
    fontWeight: 'bold',
    position: 'absolute',
    top: '15%',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: '25%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotLeft: {
    backgroundColor: '#fed7aa',
    marginRight: 4,
  },
  dotCenter: {
    backgroundColor: '#ffffff',
    marginHorizontal: 4,
  },
  dotRight: {
    backgroundColor: '#fed7aa',
    marginLeft: 4,
  },
  arc: {
    position: 'absolute',
    bottom: '35%',
    width: '60%',
    height: 2,
    backgroundColor: '#ffffff',
    opacity: 0.6,
    borderRadius: 2,
  },
});
