import React, { useState, useEffect } from "react";
import axios from "axios";
import Loader from "../utils/Loader";

const AttendanceEntry = () => {
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [selectedYearAttendance, setSelectedYearAttendance] = useState("");
  const [students, setStudents] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);

  const selectedBranch = localStorage.getItem("selectedBranch");

  // Fetch students based on selected year, semester, and section
  useEffect(() => {
    const fetchStudents = async () => {
      if (selectedYear && selectedSemester && selectedSection) {
        try {
          const response = await axios.get(
            `http://localhost:3000/api/students/filtered?year=${selectedYear}&semester=${selectedSemester}&section=${selectedSection}`
          );
          setStudents(response.data);
        } catch (error) {
          console.error("Error fetching students:", error);
        }
      }
    };
    fetchStudents();
  }, [selectedYear, selectedSemester, selectedSection]);

  // Fetch subjects based on selected branch, year, and semester
  useEffect(() => {
    const fetchSubjects = async () => {
      if (selectedYear && selectedSemester) {
        try {
          const response = await axios.get(
            `http://localhost:3000/api/subjects/branch/${selectedBranch}/year/${selectedYear}/semester/${selectedSemester}`
          );
          setSubjectOptions(response.data.slice(0, 5)); // Limit to 5 subjects
        } catch (error) {
          console.error("Error fetching subjects:", error);
        }
      }
    };
    fetchSubjects();
  }, [selectedYear, selectedSemester, selectedBranch]);

  // Fetch attendance based on selected year, month, and period
  useEffect(() => {
    const fetchAttendance = async () => {
      if (
        selectedMonth &&
        selectedYearAttendance &&
        selectedYear &&
        selectedSemester &&
        selectedSection
      ) {
        try {
          setLoading(true);
          const response = await axios.get(
            `http://localhost:3000/api/students/attendance/month/${selectedMonth}/year/${selectedYearAttendance}/period/${selectedPeriod}`
          );
          setAttendanceData(response.data);
        } catch (error) {
          console.error("Error fetching attendance:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchAttendance();
  }, [
    selectedMonth,
    selectedYearAttendance,
    selectedYear,
    selectedSemester,
    selectedSection,
  ]);

  // Group attendance data by student ID
  const groupedAttendanceData = students.map((student) => {
    const studentAttendance = attendanceData.filter(
      (att) => att.student === student._id
    );
    const attendanceBySubject = subjectOptions.map((subject) => {
      const attendanceRecord = studentAttendance.find(
        (att) => att.subject === subject._id
      );
      return attendanceRecord
        ? {
            classesAttended: attendanceRecord.classesAttended,
            totalClasses: attendanceRecord.totalClasses,
          }
        : { classesAttended: "0", totalClasses: "0" }; // Default to "0" if no attendance record
    });

    const totalAttended = attendanceBySubject.reduce(
      (sum, subject) => sum + Number(subject.classesAttended),
      0
    );
    const totalPossible = attendanceBySubject.reduce(
      (sum, subject) => sum + Number(subject.totalClasses),
      0
    );
    const percentage =
      totalPossible > 0
        ? ((totalAttended / totalPossible) * 100).toFixed(2)
        : "0.00";

    return {
      student,
      attendance: attendanceBySubject,
      totalAttended,
      totalPossible,
      percentage,
    };
  });

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <form className="bg-white shadow-md rounded-lg p-6 mb-8 w-full max-w-2xl">
        <h2 className="text-2xl font-semibold mb-4">Attendance Report</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Year Dropdown */}
          <select
            className="border p-2 rounded"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="">Select Year</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>

          {/* Semester Dropdown */}
          <select
            className="border p-2 rounded"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            <option value="">Select Semester</option>
            <option value="1">1st Semester</option>
            <option value="2">2nd Semester</option>
          </select>

          {/* Section Dropdown */}
          <select
            className="border p-2 rounded"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
          >
            <option value="">Select Section</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>

          {/* Month Dropdown */}
          <select
            className="border p-2 rounded"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="">Select Month</option>
            <option value="1">January</option>
            <option value="2">February</option>
            <option value="3">March</option>
            <option value="4">April</option>
            <option value="5">May</option>
            <option value="6">June</option>
            <option value="7">July</option>
            <option value="8">August</option>
            <option value="9">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>

          {/* Period for Attendance */}
          <select
            className="border p-2 rounded"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="">Select Attendance Period</option>
            <option value="15th">Upto 15th</option>
            <option value="30th">Upto 30th</option>
          </select>

          {/* Year for Attendance */}
          <select
            className="border p-2 rounded"
            value={selectedYearAttendance}
            onChange={(e) => setSelectedYearAttendance(e.target.value)}
          >
            <option value="">Select Attendance Year</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
          </select>
        </div>
      </form>

      {/* Conditionally render the table after attendance data is fetched */}
      {groupedAttendanceData.length > 0 && !loading && (
        <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-5xl">
          <h2 className="text-2xl font-semibold mb-4">Attendance Table</h2>
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 border">S.No</th>
                <th className="py-2 border">Roll No</th>
                <th className="py-2 border">Name</th>
                {subjectOptions.map((subject) => {
                  // Find the totalClasses for this subject from the attendance data
                  const totalClassesForSubject =
                    attendanceData.find((att) => att.subject === subject._id)
                      ?.totalClasses || 0; // Use 0 as a default if not found

                  return (
                    <th key={subject._id} className="py-2 border">
                      {subject.name} <br /> (Total: {totalClassesForSubject})
                    </th>
                  );
                })}

                {/* Calculate totalClasses combined for all unique subjects */}
                <th className="py-2 border">
                  Total <br />
                  ({subjectOptions.reduce((sum, subject) => {
                    const totalClassesForSubject =
                      attendanceData.find((att) => att.subject === subject._id)
                        ?.totalClasses || 0;
                    return sum + Number(totalClassesForSubject);
                  }, 0)})
                </th>

                <th className="py-2 border">Percentage</th>
              </tr>
            </thead>

            <tbody>
              {groupedAttendanceData.map((record, index) => (
                <tr key={record.student._id}>
                  <td className="p-3 border text-center">{index + 1}</td>
                  <td className="p-3 border text-center">
                    {record.student.rollNo}
                  </td>
                  <td className="p-3 border text-center">
                    {record.student.name}
                  </td>
                  {record.attendance.map((attended, subIndex) => (
                    <td key={subIndex} className="p-3 border text-center">
                      {attended.classesAttended}
                    </td>
                  ))}
                  <td className="p-3 border text-center">
                    {record.totalAttended}
                  </td>
                  <td className="p-3 border text-center">
                    {record.percentage}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {loading && <Loader loading={loading} />}
    </div>
  );
};

export default AttendanceEntry;
