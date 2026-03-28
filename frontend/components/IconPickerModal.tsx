import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { ICONS_MORE } from '@/constants/icons';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';

interface Props {
  visible: boolean;
  selectedIcon: string;
  selectedColor: string;
  onSelect: (icon: string) => void;
  onClose: () => void;
}

export default function IconPickerModal({ visible, selectedIcon, selectedColor, onSelect, onClose }: Props) {
  const colorWithOpacity = selectedColor + '22';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Välj ikon</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalClose}>✕</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={[...ICONS_MORE]}
          keyExtractor={(item) => item}
          numColumns={7}
          contentContainerStyle={styles.modalGrid}
          renderItem={({ item: i }) => (
            <TouchableOpacity
              style={[
                styles.modalIconBtn,
                selectedIcon === i && { backgroundColor: colorWithOpacity, borderColor: selectedColor, borderWidth: 1.5 },
              ]}
              onPress={() => {
                onSelect(i);
                onClose();
              }}
            >
              <Text style={styles.modalIconText}>{i}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal:        { flex: 1, backgroundColor: Palette.white },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.xl, borderBottomWidth: 1, borderBottomColor: Palette.gray200 },
  modalTitle:   { fontSize: Typography.xl, fontWeight: Typography.bold, color: Palette.gray900 },
  modalClose:   { fontSize: Typography.xl, color: Palette.gray500, padding: Spacing.xs },
  modalGrid:    { padding: Spacing.lg },
  modalIconBtn: { width: 44, height: 44, margin: 4, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center', backgroundColor: Palette.gray100 },
  modalIconText:{ fontSize: 28 },
});