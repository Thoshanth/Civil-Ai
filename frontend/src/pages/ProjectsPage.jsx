import { useEffect, useState } from 'react'
import { projectsAPI, documentsAPI } from '../lib/api'
import toast from 'react-hot-toast'
import Card, { CardHeader, CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Plus, Trash2, FolderOpen, Upload } from 'lucide-react'

export default function ProjectsPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [newProject, setNewProject] = useState({ name: '', description: '' })

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const response = await projectsAPI.getAll()
      setProjects(response.data)
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (e) => {
    e.preventDefault()
    try {
      await projectsAPI.create(newProject)
      setShowCreateModal(false)
      setNewProject({ name: '', description: '' })
      toast.success('Project created successfully')
      loadProjects()
    } catch (error) {
      console.error('Failed to create project:', error)
      toast.error(error.formattedMessage || 'Failed to create project')
    }
  }

  const handleDeleteProject = async (id) => {
    if (!confirm('Are you sure you want to delete this project?')) return
    try {
      await projectsAPI.delete(id)
      toast.success('Project deleted successfully')
      loadProjects()
    } catch (error) {
      console.error('Failed to delete project:', error)
      toast.error(error.formattedMessage || 'Failed to delete project')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">Manage your civil engineering projects</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FolderOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first project</p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">{project.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedProject(project)}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Documents
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDeleteProject(project.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Project</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <Input
                label="Project Name"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                required
                placeholder="Enter project name"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Enter project description"
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" className="flex-1">Create</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Documents Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {selectedProject.name} - Documents
            </h2>
            <p className="text-gray-600 mb-4">Upload and manage project documents</p>
            <Button onClick={() => setSelectedProject(null)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  )
}
