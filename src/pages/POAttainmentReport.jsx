import React, { useEffect, useState } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import Loader from "../utils/Loader";

const POAttainmentReport = () => {
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [coAttainmentAvg, setCoAttainmentAvg] = useState(0);
  const [poData, setPoData] = useState([]);
  const [finalPoValues, setFinalPoValues] = useState([]);
  const [poResponse, setPoResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showTable, setShowTable] = useState(false);

  const fetchSubjects = async () => {
    if (selectedYear && selectedSemester) {
      try {
        setLoading(true);
        const response = await axios.get(
          `${
            process.env.REACT_APP_BACKEND_URI
          }/api/subjects/branch/${localStorage.getItem(
            "selectedBranch"
          )}/year/${selectedYear}/semester/${selectedSemester}`
        );
        setSubjectOptions(response.data);
      } catch (error) {
        console.error("Error fetching subjects:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (selectedSubject) {
      try {
        setLoading(true);
        // Fetch CO attainment data
        const coResponse = await axios.get(
          `${process.env.REACT_APP_BACKEND_URI}/api/attainment/subject/${selectedSubject}/attainmentType/computedOverall`
        );

        // Calculate CO attainment average
        const attainmentLevels = coResponse.data[0].attainmentData.map(
          (co) => co.attainmentLevel
        );
        const average =
          attainmentLevels.reduce((sum, val) => sum + val, 0) /
          attainmentLevels.length;
        setCoAttainmentAvg(average);

        // Fetch PO mapping data
        const poResponseData = await axios.get(
          `${process.env.REACT_APP_BACKEND_URI}/api/co/copo-average/${selectedSubject}`
        );
        setPoResponse({ data: poResponseData.data });

        // Calculate final PO values
        const poValues = [];
        for (let i = 1; i <= 12; i++) {
          const poKey = `po${i}_avg`;
          if (poResponseData.data[poKey]) {
            poValues.push({
              po: `PO${i}`,
              value: (poResponseData.data[poKey] * average) / 3,
              weightedAverage: poResponseData.data[poKey],
            });
          }
        }
        setPoData(poValues);

        // Format data for display
        const formattedData = poValues.map((po) => ({
          name: po.po,
          value: Number(po.value.toFixed(2)),
        }));
        setFinalPoValues(formattedData);
        setShowTable(true);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [selectedYear, selectedSemester]);

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <select
                className="w-full border border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Semester
              </label>
              <select
                className="w-full border border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
              >
                <option value="">Select Semester</option>
                <option value="1">1st Semester</option>
                <option value="2">2nd Semester</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <select
                className="w-full border border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={loading || subjectOptions.length === 0}
              >
                <option value="">Select Subject</option>
                {subjectOptions.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-center mb-6">
            <button
              onClick={handleSubmit}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={!selectedSubject}
            >
              Submit
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center">
            <Loader />
          </div>
        )}

        {showTable && !loading && (
          <>
            <h1 className="text-2xl font-bold mb-2 text-center">
              Programme Outcomes (POs) Attainment
            </h1>
            <p className="text-lg font-semibold text-center mb-6">
              PO = (Weighted Average value of PO * CO Attainment Average) / 3
            </p>
            <hr className="border-t-2 border-black mb-6" />

            {/* First Table - Full Width */}
            <div className="mb-8">
              <table className="w-full border-collapse border border-gray-800">
                <thead>
                  <tr>
                    <th className="border border-gray-800 px-4 py-2">Course</th>
                    {poData.map((po) => (
                      <th
                        key={po.po}
                        className="border border-gray-800 px-4 py-2"
                      >
                        {po.po}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-800 px-4 py-2">
                      Weighted Average
                    </td>
                    {poData.map((po) => (
                      <td
                        key={po.po}
                        className="border border-gray-800 px-4 py-2 text-center"
                      >
                        {po.weightedAverage.toFixed(1)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Second Table and Graph - Side by Side */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                <table className="w-full border-collapse border border-gray-800">
                  <thead>
                    <tr>
                      <th className="border border-gray-800 px-2 py-2 w-20">
                        PO
                      </th>
                      <th className="border border-gray-800 px-2 py-2 w-24">
                        <div className="flex flex-col">
                          <span>Attainment</span>
                          <span>Level</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {poData.map((po) => (
                      <tr key={po.po}>
                        <td className="border border-gray-800 px-2 py-2 text-center">
                          {po.po}
                        </td>
                        <td className="border border-gray-800 px-2 py-2 text-center">
                          {po.value.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:w-2/3">
                <div style={{ height: "350px", width: "100%" }}>
                  <BarChart width={800} height={350} data={finalPoValues}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis
                      domain={[0, 3]}
                      ticks={[0, 0.5, 1, 1.5, 2, 2.5, 3]}
                    />
                    <Tooltip />
                    <Bar dataKey="value" fill="#800000" barSize={20} />
                  </BarChart>
                </div>
              </div>
            </div>

            {/* PSO Section */}
            <div className="mt-12">
              <h1 className="text-2xl font-bold mb-2 text-center">
                Programme Specific Outcomes (PSOs) Attainment
              </h1>
              <p className="text-lg font-semibold text-center mb-6">
                PSO = (Weighted Average value of PSO * CO Attainment Average) /
                3
              </p>
              <hr className="border-t-2 border-black mb-6" />

              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  {/* First PSO Table */}
                  <div className="mb-4">
                    <table className="w-full border-collapse border border-gray-800">
                      <thead>
                        <tr>
                          <th className="border border-gray-800 px-4 py-2">
                            Course
                          </th>
                          <th className="border border-gray-800 px-4 py-2">
                            PSO1
                          </th>
                          <th className="border border-gray-800 px-4 py-2">
                            PSO2
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-800 px-4 py-2">
                            Weighted Average
                          </td>
                          <td className="border border-gray-800 px-4 py-2 text-center">
                            {poResponse?.data?.pso1_avg?.toFixed(1) || "-"}
                          </td>
                          <td className="border border-gray-800 px-4 py-2 text-center">
                            {poResponse?.data?.pso2_avg?.toFixed(1) || "-"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Second PSO Table */}
                  <table className="w-full border-collapse border border-gray-800 mt-10">
                    <thead>
                      <tr>
                        <th className="border border-gray-800 px-4 py-2">
                          PSO
                        </th>
                        <th className="border border-gray-800 px-4 py-2">
                          <div className="flex flex-col">
                            <span>Attainment</span>
                            <span>Level</span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-800 px-4 py-2 text-center">
                          PSO1
                        </td>
                        <td className="border border-gray-800 px-4 py-2 text-center">
                          {(
                            (poResponse?.data?.pso1_avg * coAttainmentAvg) /
                            3
                          ).toFixed(2) || "-"}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-800 px-4 py-2 text-center">
                          PSO2
                        </td>
                        <td className="border border-gray-800 px-4 py-2 text-center">
                          {(
                            (poResponse?.data?.pso2_avg * coAttainmentAvg) /
                            3
                          ).toFixed(2) || "-"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* PSO Graph */}
                <div className="md:w-2/3">
                  <div style={{ height: "350px", width: "100%" }}>
                    <BarChart
                      width={500}
                      height={300}
                      data={[
                        {
                          name: "PSO1",
                          value:
                            Number(
                              (
                                (poResponse?.data?.pso1_avg * coAttainmentAvg) /
                                3
                              ).toFixed(2)
                            ) || 0,
                        },
                        {
                          name: "PSO2",
                          value:
                            Number(
                              (
                                (poResponse?.data?.pso2_avg * coAttainmentAvg) /
                                3
                              ).toFixed(2)
                            ) || 0,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis
                        domain={[0, 3]}
                        ticks={[0, 0.5, 1, 1.5, 2, 2.5, 3]}
                      />
                      <Tooltip />
                      <Bar dataKey="value" fill="#FF4500" barSize={80} />
                    </BarChart>
                  </div>
                </div>
              </div>
            </div>

            {/* PO Action Taken Report Table */}
            <div className="mt-12">
              <h1 className="text-2xl font-bold mb-2 text-center">
                PO Action Taken Report
              </h1>
              <hr className="border-t-2 border-black mb-6" />

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-800">
                  <thead>
                    <tr>
                      <th className="border border-gray-800 px-4 py-2 w-20">
                        PO
                      </th>
                      <th className="border border-gray-800 px-4 py-2 w-24">
                        <div className="flex flex-col">
                          <span>Target</span>
                          <span>set by</span>
                          <span>PAC</span>
                        </div>
                      </th>
                      <th className="border border-gray-800 px-4 py-2 w-24">
                        Attained
                      </th>
                      <th className="border border-gray-800 px-4 py-2 w-32">
                        Status
                      </th>
                      <th className="border border-gray-800 px-4 py-2">
                        Action Taken
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {poData.map((po) => (
                      <tr key={po.po}>
                        <td className="border border-gray-800 px-4 py-2 text-center">
                          {po.po}
                        </td>
                        <td className="border border-gray-800 p-0">
                          <input
                            type="number"
                            step="0.1"
                            className="w-full h-full px-2 py-2 border-none focus:outline-none"
                            placeholder="Enter target"
                          />
                        </td>
                        <td className="border border-gray-800 px-4 py-2 text-center">
                          {po.value.toFixed(2)}
                        </td>
                        <td className="border border-gray-800 p-0">
                          <input
                            type="text"
                            className="w-full h-full px-2 py-2 border-none focus:outline-none"
                            placeholder="Enter status"
                          />
                        </td>
                        <td className="border border-gray-800 p-0">
                          <textarea
                            className="w-full h-full px-2 py-2 border-none focus:outline-none resize-none"
                            rows="2"
                            placeholder="Enter action taken"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PSO Action Taken Report Table */}
            <div className="mt-12">
              <h1 className="text-2xl font-bold mb-2 text-center">
                PSO Action Taken Report
              </h1>
              <hr className="border-t-2 border-black mb-6" />

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-800">
                  <thead>
                    <tr>
                      <th className="border border-gray-800 px-4 py-2 w-20">
                        PSO
                      </th>
                      <th className="border border-gray-800 px-4 py-2 w-24">
                        <div className="flex flex-col">
                          <span>Target</span>
                          <span>set by</span>
                          <span>PAC</span>
                        </div>
                      </th>
                      <th className="border border-gray-800 px-4 py-2 w-24">
                        Attained
                      </th>
                      <th className="border border-gray-800 px-4 py-2 w-32">
                        Status
                      </th>
                      <th className="border border-gray-800 px-4 py-2">
                        Action Taken
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-800 px-4 py-2 text-center">
                        PSO1
                      </td>
                      <td className="border border-gray-800 p-0">
                        <input
                          type="number"
                          step="0.1"
                          className="w-full h-full px-2 py-2 border-none focus:outline-none"
                          placeholder="Enter target"
                        />
                      </td>
                      <td className="border border-gray-800 px-4 py-2 text-center">
                        {(
                          (poResponse?.data?.pso1_avg * coAttainmentAvg) /
                          3
                        ).toFixed(2) || "-"}
                      </td>
                      <td className="border border-gray-800 p-0">
                        <input
                          type="text"
                          className="w-full h-full px-2 py-2 border-none focus:outline-none"
                          placeholder="Enter status"
                        />
                      </td>
                      <td className="border border-gray-800 p-0">
                        <textarea
                          className="w-full h-full px-2 py-2 border-none focus:outline-none resize-none"
                          rows="2"
                          placeholder="Enter action taken"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-800 px-4 py-2 text-center">
                        PSO2
                      </td>
                      <td className="border border-gray-800 p-0">
                        <input
                          type="number"
                          step="0.1"
                          className="w-full h-full px-2 py-2 border-none focus:outline-none"
                          placeholder="Enter target"
                        />
                      </td>
                      <td className="border border-gray-800 px-4 py-2 text-center">
                        {(
                          (poResponse?.data?.pso2_avg * coAttainmentAvg) /
                          3
                        ).toFixed(2) || "-"}
                      </td>
                      <td className="border border-gray-800 p-0">
                        <input
                          type="text"
                          className="w-full h-full px-2 py-2 border-none focus:outline-none"
                          placeholder="Enter status"
                        />
                      </td>
                      <td className="border border-gray-800 p-0">
                        <textarea
                          className="w-full h-full px-2 py-2 border-none focus:outline-none resize-none"
                          rows="2"
                          placeholder="Enter action taken"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Section */}
            <div className="mt-12 mb-8">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-semibold">Date</p>
                  <div className="mt-1 border-b border-black w-48"></div>
                </div>
                <div className="flex-1 text-center">
                  <p className="font-semibold">Name & Signature of Faculty</p>
                  <div className="mt-1 border-b border-black w-72 mx-auto"></div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-end">
                    <div className="text-right">
                      <p className="font-semibold mt-1">Signature of HOD</p>
                      <div className="mt-1 border-b border-black w-48"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default POAttainmentReport;
