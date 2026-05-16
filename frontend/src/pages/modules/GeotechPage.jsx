import { useState } from 'react'
import { analysisAPI } from '../../lib/api'
import toast from 'react-hot-toast'
import Card, { CardHeader, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import FileUpload from '../../components/ui/FileUpload'
import { Mountain, FileText } from 'lucide-react'

export default function GeotechPage() {
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

      const response = await analysisAPI.geotech(formData)
      
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
      // The error message might be already handled by the global interceptor, but we can show it here if needed.
      // If the interceptor showed a toast, we don't strictly need another one unless we want to be specific.
      // We rely on the interceptor for the toast, but if we want to ensure it, we use formattedMessage.
      // Since the interceptor handles global errors, we can just log here or show a specific message.
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
        <Mountain className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Geotech Analysis</h1>
          <p className="text-gray-600 mt-1">Analyze soil investigation reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">Upload Report</h2>
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
              Analyze Report
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
                <p>Upload and analyze a report to see results</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Foundation Recommendation */}
                {result.foundation_recommendation && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Foundation Recommendation</h3>
                    <p className="text-slate-700 whitespace-pre-wrap bg-primary-50 p-4 rounded-xl border border-primary-100/50">
                      {result.foundation_recommendation}
                    </p>
                  </div>
                )}

                {/* Bearing Capacity */}
                {result.bearing_capacity && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Bearing Capacity</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-xs text-slate-500 font-bold uppercase mb-1">Shallow (kPa)</p>
                        <p className="text-lg font-semibold text-slate-800">{result.bearing_capacity.shallow_kPa || 'N/A'}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-xs text-slate-500 font-bold uppercase mb-1">Pile (kN)</p>
                        <p className="text-lg font-semibold text-slate-800">{result.bearing_capacity.pile_kN || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Soil Layers */}
                {result.soil_layers && result.soil_layers.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Soil Layers</h3>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="pb-2 font-semibold text-slate-600">Depth (m)</th>
                            <th className="pb-2 font-semibold text-slate-600">Type</th>
                            <th className="pb-2 font-semibold text-slate-600">SPT N-Value</th>
                            <th className="pb-2 font-semibold text-slate-600">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.soil_layers.map((layer, idx) => (
                            <tr key={idx} className="border-b border-slate-100 last:border-0">
                              <td className="py-2 text-slate-800">{layer.depth_m}</td>
                              <td className="py-2 text-slate-800">{layer.soil_type}</td>
                              <td className="py-2 text-slate-800">{layer.spt_n_value || '-'}</td>
                              <td className="py-2 text-slate-600">{layer.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Groundwater Depth */}
                {result.groundwater_depth_m !== undefined && result.groundwater_depth_m !== null && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Groundwater</h3>
                    <p className="text-slate-700">Depth: <strong>{result.groundwater_depth_m}m</strong></p>
                  </div>
                )}

                {/* Risk Flags */}
                {result.risk_flags && result.risk_flags.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Risk Flags</h3>
                    <ul className="list-disc list-inside space-y-1 text-red-600">
                      {result.risk_flags.map((flag, idx) => (
                        <li key={idx} className="text-sm">{flag}</li>
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
