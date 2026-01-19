import { StyleSheet, Text } from 'react-native';

export default function ModalScreen() {
  return (<>
    <Text style={styles.container}>This is a modal screen.</Text>
  </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
