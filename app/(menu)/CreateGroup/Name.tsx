import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  TouchableOpacity,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { useRouter } from 'expo-router';
import Colors from '../../../constants/Colors';
import i18n from '../../../languages/i18n';

const NameGroup = () => {
  const [groupName, setGroupName] = useState('');
  const [language, setLanguage] = useState('en');
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([
    { label: 'English 🇺🇸', value: 'en' },
    { label: 'German 🇩🇪', value: 'de' },
  ]);
  const router = useRouter();

  const handleNext = () => {
    if (groupName) {
      router.push({
        pathname: '/(menu)/CreateGroup/Package',
        params: { groupName, language },
      });
    } else {
      alert(i18n.t('nameGroup.invalidNameAlert'));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          <Text style={styles.title}>{i18n.t('nameGroup.title')}</Text>
          <TextInput
            style={styles.input}
            placeholder={i18n.t('nameGroup.groupName')}
            value={groupName}
            onChangeText={setGroupName}
          />
          <Text style={styles.title}>
            {i18n.t('nameGroup.selectLanguage')}
          </Text>
          <DropDownPicker
            open={open}
            value={language}
            items={items}
            setOpen={setOpen}
            setValue={setLanguage}
            setItems={setItems}
            placeholder={i18n.t('nameGroup.selectLanguage')}
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            // Add custom rendering for the items
            listItemLabelStyle={{ paddingLeft: 10 }}
            listItemContainerStyle={{
              flexDirection: 'row',
              alignItems: 'center',
            }}
          />
          <TouchableOpacity style={styles.buttonContainer} onPress={handleNext}>
            <Text style={styles.buttonText}>{i18n.t('nameGroup.next')}</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 10,
    marginBottom: 20,
    borderRadius: 8,
  },
  dropdown: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
  },
  dropdownContainer: {
    borderColor: '#ccc',
    borderWidth: 1,
  },
  buttonContainer: {
    backgroundColor: Colors.darkGreen,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default NameGroup;
