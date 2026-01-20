import { Text, View, TouchableOpacity } from "react-native";
import DropdownPicker from "@/components/DropdownPicker";
import { SafeAreaView } from "react-native-safe-area-context";
// import { useState } from "react";
import * as DocumentPicker from 'expo-document-picker';

const teacherData = [
  {label: "Mr. Sunil", value: "Mr. Sunil"},
  {label: "Mrs. Parul", value: "Mrs. Parul"},
  {label: "Mrs. Rakhee", value: "Mrs. Rakhee"},
];

const subjectData = [
  {label: "Discrete Maths", value: "Discrete Maths"},
  {label: "Data Structures", value: "Data Structures"},
  {label: "Core Java", value: "Core Java"},
]

const classData = [
  {label: "MCA 1st Sem", value: "MCA 1st Sem"},
  {label: "MCA 2nd Sem", value: "MCA 2nd Sem"},
  {label: "MCA 3rd Sem", value: "MCA 3rd Sem"},
]


export default function Index() {
  function pickDocument() {
    DocumentPicker.getDocumentAsync({}).then((result) => {
      console.log(result);
    });
  }

  return (
    <SafeAreaView>
      <View className="h-full bg-purple-100 p-2 pt-5">

        <Text className="text-2xl font-semibold px-4 mt-4 text-purple-700">Teacher Name</Text>
        <DropdownPicker data={teacherData}  placeholder="Select Teacher" />

        <Text className="text-2xl font-semibold px-4 mt-4 text-purple-700">Subject</Text>
        <DropdownPicker data={subjectData}  placeholder="Select Subject" />

        <Text className="text-2xl font-semibold px-4 mt-4 text-purple-700">Class Name</Text>
        <DropdownPicker data={classData}  placeholder="Select Class" />

        <Text className="text-2xl font-semibold px-4 mt-4 text-purple-700">Upload File</Text>
        <TouchableOpacity className="m-4 p-6 border-2 border-dashed border-purple-700 rounded-xl items-center justify-center h-40 bg-white" onPress={pickDocument}>
          <Text className="text-purple-700 text-xl font-semibold">Choose File to Upload</Text>
        </TouchableOpacity>


        {/* <Text>Subject</Text>
        <Text>Class Name</Text>
        <Text>Upload File</Text> */}
      </View>
    </SafeAreaView>
  );
}
