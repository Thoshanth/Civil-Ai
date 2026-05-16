package com.civilai.project;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;

    @Transactional
    public ProjectEntity createProject(UUID userId, String name, String description) {
        ProjectEntity project = ProjectEntity.builder()
                .userId(userId)
                .name(name)
                .description(description)
                .build();
        return projectRepository.save(project);
    }

    public List<ProjectEntity> getUserProjects(UUID userId) {
        return projectRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public ProjectEntity getProjectById(UUID projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
    }

    @Transactional
    public ProjectEntity updateProject(UUID projectId, String name, String description) {
        ProjectEntity project = getProjectById(projectId);
        if (name != null) project.setName(name);
        if (description != null) project.setDescription(description);
        return projectRepository.save(project);
    }

    @Transactional
    public void deleteProject(UUID projectId) {
        projectRepository.deleteById(projectId);
    }
}
