import ConfirmScreen from "@/components/ConfirmScreen";
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
  const [showModal, setShowModal] = useState(false);

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

    try {
      // 1️⃣ Request SAS URL
      const sasResponse = await fetch(
        "https://assignmentfunctionapp.azurewebsites.net/api/getUploadUrl",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            className: formData.className,
            subjectName: formData.subjectName,
            teacherName: formData.teacherName,
            fileName: formData.fileName,
          }),
        },
      );

      if (!sasResponse.ok) {
        Alert.alert("Failed to get upload URL");
        return;
      }

      const { uploadUrl, blobName } = await sasResponse.json();

      // 2️⃣ Upload file to Blob Storage
      const fileBlob = await fetch(formData.documentUri).then((res) =>
        res.blob(),
      );

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "x-ms-blob-type": "BlockBlob",
          "x-ms-version": "2020-10-02",
          "Content-Length": fileBlob.size.toString(),
        },
        body: fileBlob,
      });

      if (!uploadResponse.ok) {
        Alert.alert("Failed to upload file to Azure Blob Storage.");
        return;
      }

      // 3️⃣ Call PROCESS CSV HTTP FUNCTION
      const processResponse = await fetch(
        "https://assignmentfunctionapp.azurewebsites.net/api/processUploadedMarksHttp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blobName,
            className: formData.className,
            subjectName: formData.subjectName,
            teacherName: formData.teacherName,
          }),
        },
      );

      if (processResponse.status === 409) {
        Alert.alert("This file has already been processed.");
        return;
      }

      if (!processResponse.ok && processResponse.status !== 202) {
        Alert.alert("Failed to start CSV processing.");
        return;
      }

      // ✅ Success UX
      Alert.alert(
        "Upload successful",
        "Marks are being processed. You can check the results shortly.",
      );

      // Reset form
      setFormData({
        className: "",
        subjectName: "",
        teacherName: "",
        documentUri: "",
        fileName: "",
      });
    } catch (error) {
      console.error("Error during submission:", error);
      Alert.alert("Something went wrong. Please try again.");
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
          onPress={() => setShowModal(true)}
        >
          <Text className="text-white font-semibold text-xl">Submit</Text>
        </TouchableOpacity>

        <ConfirmScreen
          showModal={showModal}
          setShowModal={setShowModal}
          formData={formData}
          handleSubmit={handleSubmit}
        />
      </View>
    </SafeAreaView>
  );
}
