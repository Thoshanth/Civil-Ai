import { useState } from 'react'
import { analysisAPI } from '../../lib/api'
import toast from 'react-hot-toast'
import Card, { CardHeader, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import FileUpload from '../../components/ui/FileUpload'
import { Camera, Image as ImageIcon, AlertCircle } from 'lucide-react'

export default function SitePhotoPage() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleAnalyze = async () => {
    if (files.length === 0) {
      toast.error('Please upload a photo first')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', files[0])

      const response = await analysisAPI.sitePhoto(formData)
      
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
        <Camera className="w-8 h-8 text-indigo-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Site Photo Analysis</h1>
          <p className="text-gray-600 mt-1">Analyze construction site photos with AI</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">Upload Photo</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUpload
              onFilesSelected={setFiles}
              files={files}
              onRemove={(index) => setFiles(files.filter((_, i) => i !== index))}
              accept={{ 'image/*': ['.png', '.jpg', '.jpeg'] }}
            />
            {files.length > 0 && files[0].type.startsWith('image/') && (
              <div className="mt-4">
                <img
                  src={URL.createObjectURL(files[0])}
                  alt="Preview"
                  className="w-full rounded-lg"
                />
              </div>
            )}
            <Button
              onClick={handleAnalyze}
              loading={loading}
              disabled={files.length === 0}
              className="w-full"
            >
              Analyze Photo
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
                <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p>Upload a photo to see analysis</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Progress Assessment */}
                {result.progress_assessment && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Progress Assessment</h3>
                    <p className="text-slate-700 whitespace-pre-wrap bg-indigo-50 p-4 rounded-xl border border-indigo-100/50">
                      {result.progress_assessment}
                    </p>
                  </div>
                )}

                {/* Overall Safety Score */}
                {result.overall_safety_score !== undefined && result.overall_safety_score !== null && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Overall Safety Score</h3>
                    <div className="flex items-center gap-4">
                      <div className={`text-2xl font-bold ${result.overall_safety_score > 75 ? 'text-green-600' : result.overall_safety_score > 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {result.overall_safety_score}/100
                      </div>
                      <div className="flex-1 bg-slate-200 h-3 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${result.overall_safety_score > 75 ? 'bg-green-500' : result.overall_safety_score > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                          style={{ width: `${result.overall_safety_score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Safety Hazards */}
                {result.safety_hazards && result.safety_hazards.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2 text-red-600 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" /> Safety Hazards
                    </h3>
                    <div className="space-y-3">
                      {result.safety_hazards.map((hazard, index) => (
                        <div key={index} className="bg-red-50 p-4 rounded-xl border border-red-100">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-red-800">{hazard.hazard}</span>
                            <span className="text-xs font-bold px-2 py-1 bg-red-200 text-red-800 rounded uppercase">{hazard.severity}</span>
                          </div>
                          {hazard.location_in_image && <p className="text-sm text-red-700 mb-1"><strong>Location:</strong> {hazard.location_in_image}</p>}
                          <p className="text-sm text-red-700"><strong>Action:</strong> {hazard.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Visible Materials */}
                {result.visible_materials && result.visible_materials.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Visible Materials</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.visible_materials.map((material, index) => (
                        <span key={index} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium border border-slate-200">
                          {material}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {result.recommendations && result.recommendations.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Recommendations</h3>
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                      {result.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
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
