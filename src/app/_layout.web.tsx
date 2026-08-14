import { TabList, Tabs, TabSlot, TabTrigger } from 'expo-router/ui';
import { StyleSheet, Text } from 'react-native';

export default function WebLayout() {
  return (
    <Tabs style={styles.tabs}>
      <TabSlot style={styles.tabSlot} />

      <TabList style={styles.tabList}>
        <TabTrigger name="index" href="/" style={styles.tab}>
          <Text style={styles.tabText}>Home</Text>
        </TabTrigger>

        <TabTrigger name="library" href="/library" style={styles.tab}>
          <Text style={styles.tabText}>Library</Text>
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flex: 1,
  },

  tabSlot: {
    flex: 1,
  },

  tabList: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#15151D',
    borderTopWidth: 1,
    borderTopColor: '#292933',
  },

  tab: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
  },

  tabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});