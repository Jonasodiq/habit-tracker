import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { COLORS_DEFAULT, COLORS_MORE, Palette, Radius, Spacing, Typography } from '@/constants/theme';

interface Props {
  visible: boolean;
  selectedColor: string;
  onSelect: (color: string) => void;
  onClose: () => void;
}

export default function ColorPickerModal({ visible, selectedColor, onSelect, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Välj färg</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalClose}>✕</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={[...COLORS_MORE]}
          keyExtractor={(item) => item}
          numColumns={7}
          contentContainerStyle={styles.modalGrid}
          renderItem={({ item: c }) => (
            <TouchableOpacity
              style={[
                styles.modalColorDot,
                { backgroundColor: c },
                selectedColor === c && styles.colorDotActive,
                c === '#FFFFFF' && styles.colorDotBorder,
              ]}
              onPress={() => {
                onSelect(c);
                onClose();
              }}
            >
              {selectedColor === c && (
                <Text style={[styles.colorCheck, c === '#FFFFFF' && { color: '#000' }]}>✓</Text>
              )}
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal:          { flex: 1, backgroundColor: Palette.white },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.xl, borderBottomWidth: 1, borderBottomColor: Palette.gray200 },
  modalTitle:     { fontSize: Typography.xl, fontWeight: Typography.bold, color: Palette.gray900 },
  modalClose:     { fontSize: Typography.xl, color: Palette.gray500, padding: Spacing.xs },
  modalGrid:      { padding: Spacing.lg },
  modalColorDot:  { width: 40, height: 40, margin: 5, borderRadius: Radius.full, justifyContent: 'center', alignItems: 'center' },
  colorDotActive: { borderWidth: 3, borderColor: Palette.gray400 },
  colorDotBorder: { borderWidth: 1, borderColor: Palette.gray300 },
  colorCheck:     { color: Palette.white, fontSize: Typography.sm, fontWeight: Typography.bold },
});