import { Text } from "react-native";
import { Dropdown } from "react-native-element-dropdown";

type itemType = {
  label: string;
  value: string;
};

type dropdownPropTypes = {
  data: itemType[];
  placeholder: string;
};

const DropdownPicker = ({ data, placeholder }: dropdownPropTypes) => {
  return (
    <Dropdown
      data={data}
      labelField="label"
      valueField="value"
      renderItem={(selectedItem) => (
        <Text className="p-2 my-2 text-purple-700">{selectedItem.label}</Text>
      )}
      onChange={(item) => console.log(item)}
      placeholder={placeholder}
      style={{
        backgroundColor: "white",
        margin: 16,
        padding: 12,
        borderRadius: 10,
        borderColor: "#6b21a8",
        borderWidth: 1,
      }}
      selectedTextStyle={{ color: "#6b21a8" }}
      placeholderStyle={{ color: "gray", padding: 1 }}
    />
  );
};

export default DropdownPicker;
