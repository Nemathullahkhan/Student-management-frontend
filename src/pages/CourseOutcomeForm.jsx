import React, { useState, useEffect } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';

const CourseOutcome = () => {
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedCourseName, setSelectedCourseName] = useState('');
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [courseOutcomes, setCourseOutcomes] = useState([]);
  const [modifiedOutcomes, setModifiedOutcomes] = useState(new Set());
  const [coPOMatrix, setCoPOMatrix] = useState([]);
  const [modifiedMatrices, setModifiedMatrices] = useState(new Set());
  const [showTables, setShowTables] = useState(false);
  const selectedBranch = localStorage.getItem('selectedBranch');

  // Fetch subjects when year or semester changes
  useEffect(() => {
    const fetchSubjects = async () => {
      setSubjectOptions([]);
      setSelectedCourse('');
      setSelectedCourseName('');
      setShowTables(false);
      if (selectedYear && selectedSemester) {
        try {
          const response = await axios.get(
            `http://localhost:3000/api/subjects/branch/${selectedBranch}/year/${selectedYear}/semester/${selectedSemester}`
          );
          setSubjectOptions(response.data.length ? response.data : []);
        } catch (error) {
          console.error('Error fetching subjects:', error);
          setSubjectOptions([]);
        }
      }
    };
    fetchSubjects();
  }, [selectedYear, selectedSemester, selectedBranch]);

  // Fetch course outcomes and CO-PO matrix when course changes
  const fetchCourseData = async () => {
    if (selectedCourseName) {
      try {
        const [coResponse, coPoResponse] = await Promise.all([
          axios.get(`http://localhost:3000/api/co/getCourseOutcomes/${selectedCourseName}`),
          axios.get(`http://localhost:3000/api/co/getCOPOMatrix/${selectedCourseName}`) // Changed to use selectedCourseName
        ]);

        setCourseOutcomes(coResponse.data && coResponse.data.length > 0 ? coResponse.data : []);
        setCoPOMatrix(coPoResponse.data || []);
      } catch (error) {
        if (error.response && error.response.status === 404) {
          setCourseOutcomes([]);
          setCoPOMatrix([]);
        } else {
          console.error('Error fetching CO or COPOMatrix:', error);
        }
      }
    }
  };


  useEffect(() => {
    fetchCourseData();
  }, [selectedCourseName]);

  const handleCourseSelect = (e) => {
    const courseId = e.target.value;
    const courseName = subjectOptions.find(subject => subject._id === courseId)?.name || '';
    setSelectedCourse(courseId);
    setSelectedCourseName(courseName);
    setModifiedOutcomes(new Set());
    setModifiedMatrices(new Set());
    setShowTables(false);
  };

  const handlePOChange = (index, poIndex, value) => {
    const updatedMatrix = [...coPOMatrix];
    updatedMatrix[index][`po${poIndex + 1}`] = value;
    setCoPOMatrix(updatedMatrix);
    if (updatedMatrix[index]._id) {
      setModifiedMatrices(prev => new Set([...prev, updatedMatrix[index]._id]));
    }
  };

  const handleCourseOutcomeChange = (index, field, value) => {
    const updatedOutcomes = [...courseOutcomes];
    updatedOutcomes[index][field] = value;
    setCourseOutcomes(updatedOutcomes);
    if (updatedOutcomes[index]._id) {
      setModifiedOutcomes(prev => new Set([...prev, updatedOutcomes[index]._id]));
    }
  };

  const addNewCourseOutcome = () => {
    const lastCoNo = courseOutcomes.length > 0
      ? parseInt(courseOutcomes[courseOutcomes.length - 1].coNo.replace('CO', '')) || 0
      : 0;
    const newCoNo = `CO${lastCoNo + 1}`;

    const newCourseOutcome = {
      course: selectedCourseName,
      coNo: newCoNo,
      courseOutcome: '',
      knowledgeLevel: '',
    };

    setCourseOutcomes([...courseOutcomes, newCourseOutcome]);
  };

  const removeLastCourseOutcome = () => {
    if (courseOutcomes.length > 0) {
      setCourseOutcomes(courseOutcomes.slice(0, -1));
    }
  };

  const handleSubmit = async () => {
    try {
      const newOutcomes = courseOutcomes.filter(outcome => !outcome._id);

      // Create course outcomes and their corresponding COPO matrices
      for (const outcome of newOutcomes) {
        const coResponse = await axios.post('http://localhost:3000/api/co/createCourseOutcome', {
          ...outcome,
          course: selectedCourseName,
        });

        // The API response includes both the course outcome and its COPO matrix
        if (coResponse.data.coPoMatrix) {
          setCoPOMatrix(prev => [...prev, coResponse.data.coPoMatrix]);
        }
      }

      alert('New course outcomes submitted successfully!');

      // Refresh both CO and COPO data
      await fetchCourseData();
      setModifiedOutcomes(new Set());
      setModifiedMatrices(new Set());

    } catch (error) {
      console.error('Error submitting course outcomes:', error);
      alert('Error submitting course outcomes. Please try again.');
    }
  };

  const handleUpdate = async () => {
    try {
      // Update course outcomes
      for (const outcomeId of modifiedOutcomes) {
        const outcome = courseOutcomes.find(co => co._id === outcomeId);
        if (outcome) {
          await axios.patch(`http://localhost:3000/api/co/updateCourseOutcome/${outcomeId}`, {
            coNo: outcome.coNo,
            courseOutcome: outcome.courseOutcome,
            knowledgeLevel: outcome.knowledgeLevel,
            course: selectedCourseName,
          });
        }
      }

      // Update COPO matrices
      for (const matrixId of modifiedMatrices) {
        const matrix = coPOMatrix.find(m => m._id === matrixId);
        if (matrix) {
          await axios.patch(`http://localhost:3000/api/co/updateCOPOMatrix/${matrixId}`, matrix);
        }
      }

      alert('Updates saved successfully!');

      // Refresh data after updates
      await fetchCourseData();
      setModifiedOutcomes(new Set());
      setModifiedMatrices(new Set());

    } catch (error) {
      console.error('Error updating:', error);
      alert('Error updating. Please try again.');
    }
  };

  const handleResetTables = async () => {
    if (!selectedCourseName) return;

    // Show confirmation dialog
    const isConfirmed = window.confirm(
      `Are you sure you want to delete all entries for ${selectedCourseName}? This action cannot be undone.`
    );

    if (!isConfirmed) return;

    try {
      // Call the delete API with the selected course name
      await axios.delete(`http://localhost:3000/api/co/deleteCourseOutcomesBySubject/${selectedCourseName}`);

      // Reset the states
      setCourseOutcomes([]);
      setCoPOMatrix([]);
      setModifiedOutcomes(new Set());
      setModifiedMatrices(new Set());

      alert('All entries have been deleted successfully!');
    } catch (error) {
      console.error('Error deleting entries:', error);
      alert('Error deleting entries. Please try again.');
    }
  };

  // Update modified CO-PO Matrix
  const handleUpdateCOPOMatrix = async () => {
    try {
      // Update each modified matrix
      for (const matrixId of modifiedMatrices) {
        const matrix = coPOMatrix.find(m => m._id === matrixId);
        if (matrix) {
          // Remove __v and _id from the request body to avoid MongoDB conflicts
          const { __v, _id, ...matrixToUpdate } = matrix;

          await axios.patch(`http://localhost:3000/api/co/updateCOPOMatrix/${matrixId}`, {
            ...matrixToUpdate,
            course: selectedCourseName,
          });
        }
      }

      // Fetch updated data using selectedCourseName
      const coPoResponse = await axios.get(`http://localhost:3000/api/co/getCOPOMatrix/${selectedCourseName}`);

      // Update state with new data
      if (coPoResponse.data) {
        setCoPOMatrix(coPoResponse.data);
      }

      setModifiedMatrices(new Set());
      alert('CO-PO Matrix updated successfully!');

    } catch (error) {
      console.error('Error updating CO-PO Matrix:', error);
      alert('Error updating CO-PO Matrix. Please try again.');
    }
  };

  const handleDeleteCourseOutcome = async (id, courseOutcome) => {
    const isConfirmed = window.confirm('Are you sure you want to delete this course outcome?');

    if (!isConfirmed) return;

    if (!id) {
      // For new entries without an ID
      setCourseOutcomes(prevOutcomes => prevOutcomes.filter(outcome => outcome.courseOutcome !== courseOutcome));
      setCoPOMatrix(prevMatrix => prevMatrix.filter(matrix => matrix.courseOutcome !== courseOutcome));
      return;
    }

    try {
      await axios.delete(`http://localhost:3000/api/co/deleteCourseOutcomeById/${id}`);

      // Update both tables simultaneously
      setCourseOutcomes(prevOutcomes => prevOutcomes.filter(outcome => outcome._id !== id));
      setCoPOMatrix(prevMatrix => prevMatrix.filter(matrix => matrix.courseOutcome !== courseOutcome));

      alert('Course outcome deleted successfully!');
    } catch (error) {
      console.error('Error deleting course outcome:', error);
      alert('Error deleting course outcome. Please try again.');
    }
  };

  const calculateAverages = () => {
    if (coPOMatrix.length === 0) return Array(12).fill(0);

    const sums = Array(12).fill(0);
    const validCounts = Array(12).fill(0);

    coPOMatrix.forEach(matrix => {
      for (let i = 1; i <= 12; i++) {
        const value = parseFloat(matrix[`po${i}`]);
        if (!isNaN(value)) {
          sums[i - 1] += value;
          validCounts[i - 1]++;
        }
      }
    });

    return sums.map((sum, index) =>
      validCounts[index] ? (sum / validCounts[index]).toFixed(1) : '-'
    );
  };

  // Handle saving CO-PO averages
  const handleSaveAverages = async () => {
    const averages = calculateAverages();

    if (selectedCourseName && averages.length > 0) {
      try {
        const response = await axios.post('http://localhost:3000/api/co/saveCOPOAverage', {
          course: selectedCourseName,
          averages: averages
        });

        alert('Averages saved successfully!');

        console.log('Averages saved successfully:', response.data);
      } catch (error) {
        console.error('Error saving averages:', error);
      }
    }
  };

  const handleExportToImage = () => {
    // Get the element containing your tables
    const tablesContainer = document.getElementById('tables-container');
    
    if (!tablesContainer) {
      console.error('Could not find tables container');
      return;
    }
  
    // Configure html2canvas options
    const options = {
      scale: 2, // Higher scale for better quality
      backgroundColor: '#ffffff', // White background
      logging: true, // Enable logging for debugging
      useCORS: true // Handle cross-origin images if any
    };
  
    // Convert to canvas and download
    html2canvas(tablesContainer, options)
      .then(canvas => {
        // Create temporary link
        const link = document.createElement('a');
        link.download = 'course-outcome-tables.png';
        
        // Convert canvas to blob
        canvas.toBlob(blob => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            link.href = url;
            link.click();
            // Clean up
            URL.revokeObjectURL(url);
          }
        }, 'image/png', 1.0);
      })
      .catch(error => {
        console.error('Error generating image:', error);
      });
  };


  return (
    <div className="container mx-auto p-6">
      <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-md">
        <h1 className="text-2xl font-bold mb-6 text-gray-700">Course Outcome and CO-PO Matrix</h1>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-600">Year</label>
            <select
              className="mt-1 p-2 border border-gray-300 rounded w-full"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="">Select Year</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">Semester</label>
            <select
              className="mt-1 p-2 border border-gray-300 rounded w-full"
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
            >
              <option value="">Select Semester</option>
              <option value="1">1st Semester</option>
              <option value="2">2nd Semester</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">Course</label>
            <select
              className="mt-1 p-2 border border-gray-300 rounded w-full"
              value={selectedCourse}
              onChange={handleCourseSelect}
              disabled={!selectedYear || !selectedSemester}
            >
              <option value="">Select Course</option>
              {subjectOptions.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedCourse && !showTables && (
          <div className="text-center">
            <button
              onClick={() => setShowTables(true)}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
            >
              Generate Table
            </button>
          </div>
        )}

        {showTables && selectedCourse && (
          <div>
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-700">Course Outcome Table</h2>
                <div className="flex space-x-3">
                  <button
                    onClick={addNewCourseOutcome}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center space-x-2 shadow-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add New Outcome</span>
                  </button>

                  <button
                    onClick={removeLastCourseOutcome}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center space-x-2 shadow-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                    </svg>
                    <span>Remove Last Outcome</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CO No.</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Outcomes (CO)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Knowledge Level</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {courseOutcomes.map((outcome, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{selectedCourseName}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={outcome.coNo}
                            onChange={(e) => handleCourseOutcomeChange(idx, 'coNo', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            placeholder="CO1"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={outcome.courseOutcome}
                            onChange={(e) => handleCourseOutcomeChange(idx, 'courseOutcome', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            placeholder="Enter course outcome"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={outcome.knowledgeLevel}
                            onChange={(e) => handleCourseOutcomeChange(idx, 'knowledgeLevel', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          >
                            <option value="">Select Level</option>
                            {[1, 2, 3, 4, 5, 6].map((level) => (
                              <option key={level} value={`BTL-${level}`}>BTL-{level}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleDeleteCourseOutcome(outcome._id, outcome.courseOutcome)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200"
                            title="Delete course outcome"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-end space-x-4">
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 shadow-sm"
                >
                  Submit New
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={modifiedOutcomes.size === 0}
                  className={`px-6 py-2 text-white rounded-lg shadow-sm transition-colors duration-200 ${modifiedOutcomes.size > 0
                    ? 'bg-yellow-500 hover:bg-yellow-600'
                    : 'bg-gray-300 cursor-not-allowed'
                    }`}
                >
                  Update Modified
                </button>
              </div>
            </div>

            <h2 className="text-xl font-bold mt-8 mb-4 text-gray-700">CO-PO Matrix</h2>

            <table className="min-w-full table-auto border-collapse mb-6">
              <thead>
                <tr>
                  <th className="border px-4 py-2 text-left text-sm font-medium text-gray-700 bg-gray-50">
                    Course Outcomes (COs)
                  </th>
                  {[...Array(12)].map((_, i) => (
                    <th key={i} className="border px-4 py-2 text-center text-sm font-medium text-gray-700 bg-gray-50">
                      PO{i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coPOMatrix.map((matrix, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border px-4 py-2 text-sm text-gray-600">{matrix.courseOutcome}</td>
                    {[...Array(12)].map((_, i) => (
                      <td key={i} className="border px-4 py-2 text-sm text-gray-600">
                        <input
                          type="text"
                          value={matrix[`po${i + 1}`] || ''}
                          onChange={(e) => handlePOChange(idx, i, e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded text-center"
                          placeholder="0"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Average Row */}
                <tr className="bg-gray-100 font-medium">
                  <td className="border px-4 py-2 text-sm text-gray-800 font-bold">AVERAGE</td>
                  {calculateAverages().map((avg, idx) => (
                    <td key={idx} className="border px-4 py-2 text-sm text-gray-800 text-center">
                      {avg}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>

            <div className="mt-4 text-center space-x-4">
              {/* Save Button */}
              <button onClick={handleSaveAverages} className="bg-blue-500 text-white p-2 rounded">
                Save Averages
              </button>

              {/* Button to save updates made in COPO Matrix */}
              <button
                onClick={handleUpdateCOPOMatrix}
                disabled={modifiedMatrices.size === 0}
                className={`px-6 py-2 text-white rounded ${modifiedMatrices.size > 0
                  ? 'bg-yellow-500 hover:bg-yellow-700'
                  : 'bg-gray-400 cursor-not-allowed'
                  }`}
              >
                Update Modified CO-PO Matrix
              </button>

              {/* New Reset Table button */}
              <button
                onClick={handleResetTables}
                className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-700"
              >
                Reset Table
              </button>
            </div>
            
            {/* Export to Image Button */}
            <div className="mt-4 text-center">
              <button
                onClick={handleExportToImage}
                className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-700"
              >
                Export to Image
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseOutcome;