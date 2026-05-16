package com.civilai.project;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @InjectMocks
    private ProjectService projectService;

    private UUID userId;
    private UUID projectId;
    private ProjectEntity testProject;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        projectId = UUID.randomUUID();
        
        testProject = ProjectEntity.builder()
                .id(projectId)
                .userId(userId)
                .name("Test Project")
                .description("Test Description")
                .build();
    }

    @Test
    void createProject_ShouldReturnCreatedProject() {
        // Arrange
        when(projectRepository.save(any(ProjectEntity.class))).thenReturn(testProject);

        // Act
        ProjectEntity result = projectService.createProject(userId, "Test Project", "Test Description");

        // Assert
        assertNotNull(result);
        assertEquals("Test Project", result.getName());
        assertEquals("Test Description", result.getDescription());
        assertEquals(userId, result.getUserId());
        verify(projectRepository, times(1)).save(any(ProjectEntity.class));
    }

    @Test
    void getUserProjects_ShouldReturnListOfProjects() {
        // Arrange
        List<ProjectEntity> projects = Arrays.asList(testProject);
        when(projectRepository.findByUserIdOrderByCreatedAtDesc(userId)).thenReturn(projects);

        // Act
        List<ProjectEntity> result = projectService.getUserProjects(userId);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testProject.getName(), result.get(0).getName());
        verify(projectRepository, times(1)).findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Test
    void getProjectById_ShouldReturnProject() {
        // Arrange
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));

        // Act
        ProjectEntity result = projectService.getProjectById(projectId);

        // Assert
        assertNotNull(result);
        assertEquals(projectId, result.getId());
        assertEquals("Test Project", result.getName());
        verify(projectRepository, times(1)).findById(projectId);
    }

    @Test
    void getProjectById_ShouldThrowException_WhenNotFound() {
        // Arrange
        when(projectRepository.findById(projectId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () -> projectService.getProjectById(projectId));
        verify(projectRepository, times(1)).findById(projectId);
    }

    @Test
    void updateProject_ShouldUpdateAndReturnProject() {
        // Arrange
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));
        when(projectRepository.save(any(ProjectEntity.class))).thenReturn(testProject);

        // Act
        ProjectEntity result = projectService.updateProject(projectId, "Updated Name", "Updated Description");

        // Assert
        assertNotNull(result);
        verify(projectRepository, times(1)).findById(projectId);
        verify(projectRepository, times(1)).save(any(ProjectEntity.class));
    }

    @Test
    void deleteProject_ShouldCallDeleteById() {
        // Act
        projectService.deleteProject(projectId);

        // Assert
        verify(projectRepository, times(1)).deleteById(projectId);
    }
}
