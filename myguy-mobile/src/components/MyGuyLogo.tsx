import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface MyGuyLogoProps {
  size?: number;
}

export default function MyGuyLogo({ size = 60 }: MyGuyLogoProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer circle with gradient effect */}
      <View style={[styles.outerCircle, { width: size, height: size }]}>
        {/* Inner circle */}
        <View style={[styles.innerCircle, { width: size * 0.6, height: size * 0.6 }]}>
          {/* Three dots representing people */}
          <View style={styles.peopleContainer}>
            <View style={[styles.personDot, styles.centerPerson]} />
            <View style={[styles.personDot, styles.leftPerson]} />
            <View style={[styles.personDot, styles.rightPerson]} />
          </View>
        </View>
        
        {/* M letter */}
        <Text style={[styles.logoLetter, { fontSize: size * 0.25 }]}>M</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerCircle: {
    borderRadius: 1000,
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  innerCircle: {
    borderRadius: 1000,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -8,
  },
  peopleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  personDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f97316',
  },
  centerPerson: {
    marginHorizontal: 2,
  },
  leftPerson: {
    backgroundColor: '#fed7aa',
  },
  rightPerson: {
    backgroundColor: '#fed7aa',
  },
  logoLetter: {
    color: '#ffffff',
    fontWeight: 'bold',
    marginTop: 2,
  },
});
