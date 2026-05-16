import { useState } from 'react'
import { analysisAPI } from '../../lib/api'
import toast from 'react-hot-toast'
import Card, { CardHeader, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import FileUpload from '../../components/ui/FileUpload'
import { Building2, FileText } from 'lucide-react'

export default function StructuralPage() {
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

      const response = await analysisAPI.structural(formData)
      
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
        <Building2 className="w-8 h-8 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Structural Analysis</h1>
          <p className="text-gray-600 mt-1">Analyze structural drawings and calculations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">Upload Drawing</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUpload
              onFilesSelected={setFiles}
              files={files}
              onRemove={(index) => setFiles(files.filter((_, i) => i !== index))}
              accept={{ 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg'] }}
            />
            <Button
              onClick={handleAnalyze}
              loading={loading}
              disabled={files.length === 0}
              className="w-full"
            >
              Analyze Drawing
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
                <p>Upload a drawing to see analysis results</p>
              </div>
            ) : (
              <div className="space-y-4">
                {result.summary && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{result.summary}</p>
                  </div>
                )}
                {result.elements && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Structural Elements</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(result.elements, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                {result.recommendations && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Recommendations</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{result.recommendations}</p>
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
