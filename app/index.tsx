import DropdownPicker from "@/components/DropdownPicker";
import { classData, subjectData, teacherData } from "@/constants/data";
import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type formDataType = {
  className: string;
  subjectName: string;
  teacherName: string;
  documentUri: string;
  fileName: string;
};

export default function Index() {
  const [formData, setFormData] = useState<formDataType>({
    className: "",
    subjectName: "",
    teacherName: "",
    documentUri: "",
    fileName: "",
  });

  function pickDocument() {
    DocumentPicker.getDocumentAsync({}).then((documentData) => {
      // console.log(documentData);
      if (documentData.canceled) {
        // Handle cancel if needed
        Alert.alert("Document selection was canceled.");
        return;
      } else if (
        documentData.assets[0].mimeType !== "text/comma-separated-values"
      ) {
        Alert.alert("Please select a CSV document.");
        return;
      }
      setFormData((prev) => ({
        ...prev,
        documentUri: documentData.assets?.[0]?.uri || "",
        fileName: documentData.assets?.[0]?.name || "",
      }));
    });
  }

  function updateFormData(field: keyof formDataType, value: string) {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleSubmit() {
    if (
      formData.className === "" ||
      formData.subjectName === "" ||
      formData.teacherName === "" ||
      formData.documentUri === ""
    ) {
      Alert.alert(
        "Please fill all the fields and upload a document before submitting.",
      );
      return;
    }
    // console.log(formData);
    Alert.alert("Form submitted successfully!");
    setFormData({
      className: "",
      subjectName: "",
      teacherName: "",
      documentUri: "",
      fileName: "",
    });
    try {
      // console.log("Requesting SAS URL from Azure Function...");
      const sasResponse = await fetch(
        "https://azureassignment.azurewebsites.net/api/getUploadUrl",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            className: formData.className,
            subjectName: formData.subjectName,
            teacherName: formData.teacherName,
            fileName: formData.fileName,
          }),
        },
      );
      const { uploadUrl } = await sasResponse.json();
      // console.log("Upload URL: ", uploadUrl);

      const fileBlob = await fetch(formData.documentUri).then((res) =>
        res.blob(),
      );

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "x-ms-blob-type": "BlockBlob",
          "x-ms-version": "2020-10-02",
          "Content-Length": fileBlob.size.toString(),
          "x-ms-meta-classname": formData.className,
          "x-ms-meta-subjectname": formData.subjectName,
          "x-ms-meta-teachername": formData.teacherName,
        },
        body: fileBlob,
      });

      if (uploadResponse.ok) {
        Alert.alert("File uploaded successfully to Azure Blob Storage.");
        setFormData({
          className: "",
          subjectName: "",
          teacherName: "",
          documentUri: "",
          fileName: "",
        });
      } else {
        // console.log(uploadResponse)
        Alert.alert("Failed to upload file to Azure Blob Storage.");
      }
    } catch (error) {
      console.error("Error during form submission: ", error);
      Alert.alert("Error submitting the form. Please try again. " + error);
    }
  }

  return (
    <SafeAreaView>
      <View className="h-full bg-purple-100 p-2 pt-5">
        <Text className="text-2xl font-semibold px-4 mt-4 text-purple-700">
          Teacher Name
        </Text>
        <DropdownPicker
          data={teacherData}
          placeholder="Select Teacher"
          value={formData.teacherName}
          onChange={(v) => updateFormData("teacherName", v)}
        />

        <Text className="text-2xl font-semibold px-4 mt-4 text-purple-700">
          Subject
        </Text>
        <DropdownPicker
          data={subjectData}
          placeholder="Select Subject"
          value={formData.subjectName}
          onChange={(v) => updateFormData("subjectName", v)}
        />

        <Text className="text-2xl font-semibold px-4 mt-4 text-purple-700">
          Class Name
        </Text>
        <DropdownPicker
          data={classData}
          placeholder="Select Class"
          value={formData.className}
          onChange={(v) => updateFormData("className", v)}
        />

        <Text className="text-2xl font-semibold px-4 mt-4 text-purple-700">
          Upload File
        </Text>
        <TouchableOpacity
          className="m-4 p-6 border-2 border-dashed border-purple-700 rounded-xl items-center justify-center h-40 bg-white"
          onPress={pickDocument}
        >
          <Text className="text-purple-700 text-xl font-semibold">
            {formData.fileName
              ? formData.fileName
              : "Tap to select a CSV document"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-purple-700 m-4 p-4 rounded-xl items-center justify-center mt-8"
          onPress={handleSubmit}
        >
          <Text className="text-white font-semibold text-xl">Submit</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
