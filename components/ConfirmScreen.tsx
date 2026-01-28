import React from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";

type ConfirmScreenProps = {
  showModal: boolean;
  setShowModal: (visible: boolean) => void;
  formData: {
    className: string;
    subjectName: string;
    teacherName: string;
    documentUri: string;
    fileName: string;
  };
  handleSubmit: () => void;
};

const ConfirmScreen = ({
  showModal,
  setShowModal,
  formData,
  handleSubmit,
}: ConfirmScreenProps) => {
  return (
    <Modal
      visible={showModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowModal(false)}
    >
      <View className="flex-1 bg-black/40 justify-center items-center">
        <View className="bg-white rounded-2xl p-6 w-11/12">
          <Text className="text-lg font-semibold mb-4 text-purple-700">
            Confirm submission
          </Text>
          <Text className="mb-6 text-gray-700">
            Are you sure you want to submit this form?
          </Text>
          <Text>Class: {formData.className}</Text>
          <Text>Subject: {formData.subjectName}</Text>
          <Text>Teacher: {formData.teacherName}</Text>
          <Text>File: {formData.fileName}</Text>

          <View className="flex-row justify-end">
            <TouchableOpacity
              className="mr-4 px-4 py-2"
              onPress={() => setShowModal(false)}
            >
              <Text className="text-purple-700 font-semibold">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-purple-700 px-4 py-2 rounded-lg"
              onPress={() => {
                setShowModal(false);
                handleSubmit();
              }}
            >
              <Text className="text-white font-semibold">Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConfirmScreen;
