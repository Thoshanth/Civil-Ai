import { useState } from 'react'
import { analysisAPI } from '../../lib/api'
import toast from 'react-hot-toast'
import Card, { CardHeader, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import FileUpload from '../../components/ui/FileUpload'
import { FileText, AlertCircle } from 'lucide-react'

export default function TenderPage() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleAnalyze = async () => {
    if (files.length === 0) {
      toast.error('Please upload a file first')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', files[0])

      const response = await analysisAPI.tender(formData)
      
      // Parse the nested response structure
      let parsedResponse
      if (response.data?.data) {
        // If data is a string (JSON), parse it
        if (typeof response.data.data === 'string') {
          parsedResponse = JSON.parse(response.data.data)
        } else {
          parsedResponse = response.data.data
        }
      } else {
        parsedResponse = response.data
      }
      
      // Extract the actual analysis data from LLMResponse
      const analysisResult = parsedResponse.data || parsedResponse
      
      setResult(analysisResult)
      toast.success('Analysis completed successfully!')
    } catch (error) {
      console.error('Analysis failed:', error)
      if (!error.formattedMessage) {
        toast.error('Analysis failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="w-8 h-8 text-red-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tender Analysis</h1>
          <p className="text-gray-600 mt-1">Analyze tender documents and extract key information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">Upload Tender Document</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUpload
              onFilesSelected={setFiles}
              files={files}
              onRemove={(index) => setFiles(files.filter((_, i) => i !== index))}
              accept={{ 'application/pdf': ['.pdf'] }}
            />
            <Button
              onClick={handleAnalyze}
              loading={loading}
              disabled={files.length === 0}
              className="w-full"
            >
              Analyze Tender
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">Analysis Results</h2>
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p>Upload a tender document to see analysis</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Project Overview */}
                {(result.project_name || result.tender_value_inr) && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900">{result.project_name || 'Tender Document'}</h3>
                    {result.tender_value_inr && (
                      <p className="text-red-600 font-semibold mt-1">
                        Est. Value: ₹{result.tender_value_inr.toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                )}

                {/* Scope Summary */}
                {result.scope_summary && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Scope Summary</h3>
                    <p className="text-slate-700 whitespace-pre-wrap bg-white p-4 rounded-xl border border-slate-100">
                      {result.scope_summary}
                    </p>
                  </div>
                )}

                {/* Key Dates */}
                {result.key_dates && result.key_dates.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Key Dates</h3>
                    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-2 font-semibold text-slate-600">Event</th>
                            <th className="px-4 py-2 font-semibold text-slate-600">Date</th>
                            <th className="px-4 py-2 font-semibold text-slate-600">Days Remaining</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {result.key_dates.map((date, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-2 text-slate-800">{date.event}</td>
                              <td className="px-4 py-2 text-slate-800 font-medium">{date.date}</td>
                              <td className="px-4 py-2 text-slate-600">
                                {date.days_remaining !== null && date.days_remaining !== undefined ? 
                                  <span className={`px-2 py-1 rounded text-xs font-bold ${date.days_remaining < 7 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                    {date.days_remaining} days
                                  </span> : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Eligibility Criteria */}
                {result.eligibility_criteria && result.eligibility_criteria.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Eligibility Criteria</h3>
                    <div className="space-y-2">
                      {result.eligibility_criteria.map((criteria, index) => (
                        <div key={index} className={`p-3 rounded-lg border ${criteria.is_critical ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                          <div className="flex justify-between items-start">
                            <span className="font-semibold text-slate-800">{criteria.criterion}</span>
                            {criteria.is_critical && <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-red-200 text-red-800 rounded">Critical</span>}
                          </div>
                          <p className="text-sm text-slate-600 mt-1">{criteria.requirement}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Risk Clauses */}
                {result.risk_clauses && result.risk_clauses.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      Risk Clauses
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                      {result.risk_clauses.map((risk, index) => (
                        <li key={index} className="text-sm">{risk}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Compliance Checklist */}
                {result.compliance_checklist && result.compliance_checklist.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Compliance Checklist</h3>
                    <ul className="space-y-2">
                      {result.compliance_checklist.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                          <div className="mt-0.5 min-w-4 h-4 rounded border border-slate-300 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
