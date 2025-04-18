import React, { useState, useEffect } from "react";
import axios from "axios";

const Marks = () => {
  const [submitted, setSubmitted] = useState(false);
  const [examType, setExamType] = useState("");
  const [maxMarks, setMaxMarks] = useState(0);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedRegulation, setSelectedRegulation] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [students, setStudents] = useState([]);

  const selectedBranch = localStorage.getItem("selectedBranch");

  // Fetch subjects based on selected year, semester, and section
  useEffect(() => {
    const fetchSubjects = async () => {
      if (selectedYear && selectedSemester) {
        try {
          const response = await axios.get(
            `${process.env.REACT_APP_BACKEND_URI}/api/subjects/branch/${selectedBranch}/year/${selectedYear}/semester/${selectedSemester}`
          );
          // Check if API response contains subjects or a message
          if (
            response.data &&
            Array.isArray(response.data) &&
            response.data.length > 0
          ) {
            setSubjectOptions(response.data);
          } else {
            setSubjectOptions([]); // Clear the dropdown if no subjects are found
          }
        } catch (error) {
          console.error("Error fetching subjects:", error);
          setSubjectOptions([]); // Ensure dropdown is cleared on error
        }
      } else {
        setSubjectOptions([]); // Reset when year/semester is deselected
      }
    };
    fetchSubjects();
  }, [selectedYear, selectedSemester, selectedBranch]);

  // Fetch students based on the selected subject, year, semester, and section
  useEffect(() => {
    const fetchStudents = async () => {
      if (selectedSubject && examType) {
        try {
          // Fetch students based on selected criteria
          const studentsResponse = await axios.get(
            `${process.env.REACT_APP_BACKEND_URI}/api/students/filtered?branch=${selectedBranch}&year=${selectedYear}&semester=${selectedSemester}&section=${selectedSection}&subjectId=${selectedSubject}`
          );

          // Fetch marks for the students
          const marksResponse = await axios.get(
            `${process.env.REACT_APP_BACKEND_URI}/api/marks/${selectedSubject}/${examType}`
          );

          // Map marks to the corresponding students
          const studentsWithMarks = studentsResponse.data.map((student) => {
            const markEntry = marksResponse.data.find(
              (mark) => mark.student._id === student._id
            );
            return {
              ...student,
              marks: markEntry ? markEntry.marks : "", // Set marks if available, else empty
            };
          });

          setStudents(studentsWithMarks);
        } catch (error) {
          console.error("Error fetching students or marks:", error);
        }
      }
    };
    // Fetch students when the subject changes
    fetchStudents();
  }, [
    selectedSubject,
    selectedYear,
    selectedSemester,
    selectedSection,
    examType,
  ]);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  // Handle exam type change and update max marks
  const handleExamTypeChange = (e) => {
    const selectedExamType = e.target.value;
    setExamType(selectedExamType);

    // Set max marks based on exam type (included SEE)
    if (selectedExamType === "CIE-1" || selectedExamType === "CIE-2") {
      setMaxMarks(20);
    } else if (selectedExamType === "SEE") {
      setMaxMarks(100);
    } else {
      setMaxMarks(10);
    }
  };

  // Handle marks input change and ensure it doesn't exceed max marks
  const handleMarksChange = (index, value) => {
    if (value <= maxMarks) {
      const updatedStudents = [...students];
      updatedStudents[index].marks = value; // Update marks in state
      setStudents(updatedStudents);
    } else {
      alert(`Marks cannot exceed the maximum of ${maxMarks}`);
    }
  };

  // Handle form submission
  // Handle Save Marks
  const handleSave = async () => {
    try {
      for (let student of students) {
        const { _id, marks } = student;

        // Check if marks entry exists
        if (marks) {
          const existingMarkEntry = await axios.get(
            `${process.env.REACT_APP_BACKEND_URI}/api/marks/${selectedSubject}/${examType}`
          );

          const markEntryToUpdate = existingMarkEntry.data.find(
            (mark) => mark.student._id === _id
          );

          if (markEntryToUpdate) {
            // Make PUT request to update existing marks
            await axios.put(
              `${process.env.REACT_APP_BACKEND_URI}/api/marks/${selectedSubject}/${examType}/${markEntryToUpdate._id}`,
              {
                student: _id,
                subject: selectedSubject,
                examType: examType,
                marks: marks, // Updated marks
                maxMarks: maxMarks,
                regulation: "LR21", // You can change this to whatever regulation you want
                year: selectedYear,
                semester: selectedSemester,
                section: selectedSection,
              }
            );
          } else {
            // Create a new marks entry if it doesn't exist
            await handleSaveNewMarks(_id, marks);
          }
        }
      }
    } catch (error) {
      console.error("Error updating marks:", error);
      alert("Failed to update marks");
    }
  };

  // Handle saving new marks for a student
  const handleSaveNewMarks = async (studentId, marks) => {
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URI}/api/marks`, {
        student: studentId,
        subject: selectedSubject,
        examType: examType,
        marks: marks,
        maxMarks: maxMarks,
        regulation: selectedRegulation, // You can change this to whatever regulation you want
        year: selectedYear,
        semester: selectedSemester,
        section: selectedSection,
      });
    } catch (error) {
      console.error("Error creating marks:", error);
      alert("Failed to create marks");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <form
        className="bg-white shadow-lg rounded-lg p-6 mb-8 w-full max-w-2xl"
        onSubmit={handleSubmit}
      >
        <h2 className="text-3xl tracking-tigher font-semibold mb-4">Marks Entry</h2>

        {/* Dropdowns for selecting criteria */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Static Year Dropdown */}
          <select
            className="border px-1 rounded-lg h-8 text-sm font-medium shadow-sm focus-visible:outline-none"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="">Select Year</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>

          {/* Static Semester Dropdown */}
          <select
            className="border px-1 rounded-lg h-8 text-sm font-medium shadow-sm focus-visible:outline-none"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            <option value="">Select Semester</option>
            <option value="1">1st Semester</option>
            <option value="2">2nd Semester</option>
          </select>

          {/* Static Section Dropdown */}
          <select
            className="border px-1 rounded-lg h-8 text-sm font-medium shadow-sm focus-visible:outline-none"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
          >
            <option value="">Select Section</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>

          {/* Static Regulation Dropdown */}
          <select
            className="border px-1 rounded-lg h-8 text-sm font-medium shadow-sm focus-visible:outline-none"
            value={selectedRegulation}
            onChange={(e) => setSelectedRegulation(e.target.value)}
          >
            <option value="">Select Regulation</option>
            <option value="LR21">LR21</option>
            <option value="LR22">LR22</option>
            <option value="LR23">LR23</option>
          </select>

          {/* Subject Dropdown (dynamically populated) */}
          <select
            className="border px-1 rounded-lg h-8 text-sm font-medium shadow-sm focus-visible:outline-none"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">Select Subject</option>
            {subjectOptions.length > 0 ? (
              subjectOptions.map((subject) => (
                <option key={subject.id} value={subject._id}>
                  {subject.name}
                </option>
              ))
            ) : (
              <option value="" disabled>
                No subjects available
              </option>
            )}
          </select>

          {/* Static Exam Type Dropdown */}
          <select
            className="border px-1 rounded-lg h-8 text-sm font-medium shadow-sm focus-visible:outline-none"
            value={examType}
            onChange={handleExamTypeChange}
          >
            <option value="">Select Test Type</option>
            <option value="CIE-1">CIE-1</option>
            <option value="CIE-2">CIE-2</option>
            <option value="ASSIGNMENT-1">Assignment-1</option>
            <option value="ASSIGNMENT-2">Assignment-2</option>
            <option value="ASSIGNMENT-3">Assignment-3</option>
            <option value="SURPRISE TEST-1">Surprise Test-1</option>
            <option value="SURPRISE TEST-2">Surprise Test-2</option>
            <option value="SURPRISE TEST-3">Surprise Test-3</option>
            <option value="SEE">Semester End Exam</option>
          </select>
        </div>

        {/* Max Marks Display */}
        {examType && (
          <div className="flex justify-center">
          <p className="mt-3 text-lg text-blue-700 transition-all transition-smooth tracking-tight flex gap-x-1">
            The maximum marks for{" "}
            <span className="text-blue-800 font-semibold">{examType}</span> is
            <span className="text-blue-800 text-xl font-semibold">
              {maxMarks}.
            </span>
          </p>
        </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          className="mt-4 px-4 w-32 h-8 text-center  bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Enter
        </button>
      </form>
``
      {/* Conditionally render the table after marks data is fetched */}
      {submitted && students.length > 0 && (
        <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-2xl">
          <h2 className="text-2xl font-semibold mb-4">Marks Data</h2>
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 border">S.No</th>
                <th className="py-2 border">Roll No</th>
                <th className="py-2 border">Name</th>
                <th className="py-2 border">Marks</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr key={student._id}>
                  <td className="py-2 border text-center">{index + 1}</td>
                  <td className="py-2 border text-center">{student.rollNo}</td>
                  <td className="py-2 border text-center">{student.name}</td>
                  <td className="py-2 border text-center">
                    <input
                      type="number"
                      className="border p-2 rounded w-full text-center"
                      value={student.marks}
                      onChange={(e) => handleMarksChange(index, e.target.value)}
                      max={maxMarks}
                      min={0}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Save button */}
          <div className="mt-4 flex justify-end space-x-4">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={handleSave}
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marks;
