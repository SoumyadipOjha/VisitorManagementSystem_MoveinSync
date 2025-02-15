import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import Webcam from "react-webcam";

const VisitorForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);

  // Function to capture image
  const capturePhoto = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
  };

  // Convert base64 to File
  const dataURLtoFile = (dataUrl, fileName) => {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], fileName, { type: mime });
  };

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append("fullName", data.fullName);
      formData.append("contact", data.contact);
      formData.append("purpose", data.purpose);
      formData.append("hostEmployee", data.hostEmployee);
      formData.append("company", data.company || "");

      // Convert captured image to file and append
      if (capturedImage) {
        const photoFile = dataURLtoFile(capturedImage, "visitor_photo.jpg");
        formData.append("photo", photoFile);
      }

      await axios.post("http://localhost:5000/api/visitors", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Visitor registered successfully!");
    } catch (error) {
      console.error("Error submitting form", error);
      alert("Failed to register visitor.");
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Visitor Registration</h2>
      <form onSubmit={handleSubmit(onSubmit)} style={styles.form}>
        <label style={styles.label}>Full Name:</label>
        <input {...register("fullName", { required: "Full Name is required" })} style={styles.input} />
        {errors.fullName && <p style={styles.error}>{errors.fullName.message}</p>}

        <label style={styles.label}>Contact Information:</label>
        <input {...register("contact", { required: "Contact is required" })} style={styles.input} />
        {errors.contact && <p style={styles.error}>{errors.contact.message}</p>}

        <label style={styles.label}>Purpose of Visit:</label>
        <select {...register("purpose", { required: "Purpose is required" })} style={styles.select}>
          <option value="">Select</option>
          <option value="Meeting">Meeting</option>
          <option value="Interview">Interview</option>
          <option value="Delivery">Delivery</option>
        </select>
        {errors.purpose && <p style={styles.error}>{errors.purpose.message}</p>}

        <label style={styles.label}>Host Employee:</label>
        <input {...register("hostEmployee", { required: "Host Employee is required" })} style={styles.input} />
        {errors.hostEmployee && <p style={styles.error}>{errors.hostEmployee.message}</p>}

        <label style={styles.label}>Company/Organization:</label>
        <input {...register("company")} style={styles.input} />

        {/* Webcam Component */}
        <div style={styles.webcamContainer}>
          <h4 style={styles.webcamHeading}>Capture Photo:</h4>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width={250}
            height={200}
            style={styles.webcam}
          />
          <button type="button" onClick={capturePhoto} style={styles.button}>Capture Photo</button>
        </div>

        {/* Display Captured Image */}
        {capturedImage && (
          <div>
            <h4 style={styles.webcamHeading}>Captured Image:</h4>
            <img src={capturedImage} alt="Captured" width={250} height={200} style={styles.capturedImage} />
          </div>
        )}

        <button type="submit" style={styles.submitButton}>Submit</button>
      </form>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "500px",
    margin: "50px auto",
    padding: "20px",
    background: "#fff",
    borderRadius: "10px",
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
    textAlign: "center",
  },
  heading: {
    fontSize: "24px",
    color: "#333",
    marginBottom: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  label: {
    fontSize: "16px",
    color: "#444",
    fontWeight: "bold",
    textAlign: "left",
  },
  input: {
    padding: "8px",
    fontSize: "14px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    outline: "none",
  },
  select: {
    padding: "8px",
    fontSize: "14px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    outline: "none",
    background: "#fff",
  },
  error: {
    color: "red",
    fontSize: "12px",
    textAlign: "left",
  },
  webcamContainer: {
    marginTop: "15px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
  },
  webcamHeading: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#444",
  },
  webcam: {
    borderRadius: "5px",
    border: "1px solid #ccc",
  },
  button: {
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    padding: "8px 12px",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    borderRadius: "5px",
    transition: "background 0.3s ease-in-out",
  },
  buttonHover: {
    backgroundColor: "#0056b3",
  },
  capturedImage: {
    borderRadius: "5px",
    marginTop: "10px",
    border: "1px solid #ccc",
  },
  submitButton: {
    marginTop: "15px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    padding: "10px 15px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    borderRadius: "5px",
    transition: "background 0.3s ease-in-out",
  },
};

export default VisitorForm;
