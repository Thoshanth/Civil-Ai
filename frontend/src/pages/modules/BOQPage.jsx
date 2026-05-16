import { useState } from 'react'
import { analysisAPI } from '../../lib/api'
import toast from 'react-hot-toast'
import Card, { CardHeader, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import FileUpload from '../../components/ui/FileUpload'
import { FileSpreadsheet, Download } from 'lucide-react'

export default function BOQPage() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleGenerate = async () => {
    if (files.length === 0) {
      toast.error('Please upload a file first')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', files[0])

      const response = await analysisAPI.boq(formData)
      
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
      toast.success('BOQ generated successfully!')
    } catch (error) {
      console.error('BOQ generation failed:', error)
      if (!error.formattedMessage) {
        toast.error('BOQ generation failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!result?.items) return
    
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'boq.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileSpreadsheet className="w-8 h-8 text-green-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">BOQ Generation</h1>
          <p className="text-gray-600 mt-1">Generate Bill of Quantities from drawings</p>
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
              onClick={handleGenerate}
              loading={loading}
              disabled={files.length === 0}
              className="w-full"
            >
              Generate BOQ
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Generated BOQ</h2>
            {result && (
              <Button size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="text-center py-12 text-gray-500">
                <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p>Upload a drawing to generate BOQ</p>
              </div>
            ) : (
              <div className="space-y-4">
                {result.summary && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{result.summary}</p>
                  </div>
                )}
                
                {result.total_amount_inr && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Total Amount</h3>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{result.total_amount_inr.toLocaleString('en-IN')}
                    </p>
                  </div>
                )}
                
                {result.items && result.items.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">BOQ Items</h3>
                    <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                      <div className="space-y-3">
                        {result.items.map((item, index) => (
                          <div key={index} className="bg-white p-3 rounded border">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium text-gray-900">
                                {item.item_no}. {item.description}
                              </span>
                              <span className="font-bold text-green-600">
                                ₹{item.amount_inr?.toLocaleString('en-IN')}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              Qty: {item.quantity} {item.unit} × ₹{item.cpwd_rate_inr?.toLocaleString('en-IN')}/{item.unit}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {result.notes && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
                    <p className="text-sm text-gray-600">{result.notes}</p>
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
