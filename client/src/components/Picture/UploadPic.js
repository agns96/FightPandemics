import React, { useRef, useState } from "react";
import { Modal } from "antd";
import { CameraOutlined } from "@ant-design/icons";
import axios from "axios";
import BaseButton from "../Button/BaseButton";
import ReactCrop from "react-image-crop";
import styled from "styled-components";
import { theme } from "../../constants/theme";

const { colors } = theme;

const CustomSubmitButton = styled(BaseButton)`
  background: ${colors.royalBlue};
  color: ${colors.white};
`;

const CustomCancelButton = styled(BaseButton)``;

function isImageFile(file) {
  return file && file["type"].split("/")[0] === "image";
}

const UploadPic = ({ cameraIconSize, user }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [photoURL, setPhotoURL] = useState();
  const [uploadError, setUploadError] = useState();
  const [image, setImage] = useState();
  const [crop, setCrop] = useState({
    aspect: 1 / 1,
    unit: "px",
    height: 250,
    width: 250,
  });
  const imgUpload = useRef(null);

  const imageLoaded = (image) => {
    setImage(image);
  };

  const handleImage = (e) => {
    setUploadError("");
    const file = e.target.files[0];
    if (!isImageFile(file)) {
      setUploadError(`Sorry, we only support image files.`);
      return;
    } else if (file && file.size > 5001520) {
      setUploadError("Please upload an image of size less than 5 MB.");
      return;
    } else {
      const fileReader = new FileReader();
      fileReader.onloadend = () => {
        const image = new Image();
        image.src = fileReader.result;
        image.onload = () => {
          if (image.height < 250 || image.width < 250) {
            setUploadError(
              "Please upload an image that is atleast 250 pixels tall and 250 pixels wide.",
            );
            return;
          }
        };
        setPhotoURL(fileReader.result);
      };
      if (file) {
        fileReader.readAsDataURL(file);
      }
    }
    setModalVisible(true);
  };

  const savePhoto = async () => {
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height,
    );
    const reader = new FileReader();
    canvas.toBlob((blob) => {
      let uploadResponse;
      let endPoint = "/api/users/current/avatar";
      const formData = new FormData();
      formData.append("file", blob);
      if (user.ownerId) {
        endPoint = `/api/organisations/${user._id}/avatar`;
      }
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        try {
          uploadResponse = await axios({
            method: "post",
            url: endPoint,
            data: formData,
            headers: {
              accept: "application/json",
              "Content-Type": `multipart/form-data`,
            },
          });
          if (uploadResponse.status == 200) {
            setModalVisible(false);
            window.location.reload(false);
            console.log("Success");
          }
        } catch (error) {
          setUploadError("Sorry, some network error occurred.");
          console.log({
            error,
          });
        }
      };
    });
    setModalVisible(false);
  };

  const closeModal = () => {
    imgUpload.current.value = "";
    setUploadError("");
    setModalVisible(false);
  };

  const retry = () => {
    imgUpload.current.value = "";
    imgUpload.current.click();
  };

  const cropModal = () => {
    return (
      <Modal
        visible={modalVisible}
        height={"50rem"}
        width={"50rem"}
        okText={"Save"}
        onOk={savePhoto}
        destroyOnClose={true}
        closable={false}
        onCancel={() => setModalVisible(false)}
        maskClosable={false}
        footer={[
          <CustomCancelButton key="cancel" onClick={closeModal}>
            Cancel
          </CustomCancelButton>,
          !uploadError ? (
            <CustomSubmitButton key="save" onClick={savePhoto}>
              Submit
            </CustomSubmitButton>
          ) : (
            <CustomSubmitButton key="retry" onClick={retry}>
              Try Again
            </CustomSubmitButton>
          ),
        ]}
      >
        <div
          style={{
            textAlign: "center",
          }}
        >
          {uploadError ? (
            <h3>{uploadError}</h3>
          ) : (
            <ReactCrop
              src={photoURL}
              crop={crop}
              minHeight={250}
              minWidth={250}
              circularCrop={true}
              ruleOfThirds
              keepSelection={true}
              onImageLoaded={imageLoaded}
              onChange={(newCrop) => setCrop(newCrop)}
            />
          )}
        </div>
      </Modal>
    );
  };

  return (
    <div>
      <input
        ref={imgUpload}
        onChange={handleImage}
        type="file"
        accept="image/*"
        style={{
          display: "none",
        }}
      />
      <button
        id="PR-UA"
        name="avatar-upload-button"
        type="button"
        onClick={() => imgUpload.current.click()}
        style={{
          border: 0,
          borderColor: "hidden",
          padding: "0.6rem",
          borderRadius: "50%",
          backgroundColor: colors.royalBlue,
          cursor: "pointer",
        }}
      >
        <CameraOutlined
          style={{ fontSize: 18 || cameraIconSize, color: colors.offWhite }}
        />
      </button>
      {cropModal()}
    </div>
  );
};

export default UploadPic;
