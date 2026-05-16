import { useState } from 'react'
import { analysisAPI } from '../../lib/api'
import toast from 'react-hot-toast'
import Card, { CardHeader, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { BookOpen, Search } from 'lucide-react'

export default function ISCodePage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) {
      toast.error('Please enter a query')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await analysisAPI.iscode({ query })
      
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
      toast.success('Search completed successfully!')
    } catch (error) {
      console.error('Search failed:', error)
      if (!error.formattedMessage) {
        toast.error('Search failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="w-8 h-8 text-yellow-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">IS Code Assistant</h1>
          <p className="text-gray-600 mt-1">Search and query Indian Standard codes</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Search IS Codes</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-3">
              <Input
                placeholder="Ask a question about IS codes..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" loading={loading}>
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">Results</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {result.answer && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Answer</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{result.answer}</p>
                </div>
              )}
              {result.references && result.references.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">References</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {result.references.map((ref, index) => (
                      <li key={index} className="text-gray-700">{ref}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
