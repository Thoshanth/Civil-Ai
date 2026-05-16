package com.civilai.project;

import com.civilai.user.UserEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    public ResponseEntity<ProjectEntity> createProject(
            @AuthenticationPrincipal UserEntity user,
            @RequestBody Map<String, String> request) {
        ProjectEntity project = projectService.createProject(
                user.getId(),
                request.get("name"),
                request.get("description")
        );
        return ResponseEntity.ok(project);
    }

    @GetMapping
    public ResponseEntity<List<ProjectEntity>> getUserProjects(
            @AuthenticationPrincipal UserEntity user) {
        List<ProjectEntity> projects = projectService.getUserProjects(user.getId());
        return ResponseEntity.ok(projects);
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<ProjectEntity> getProject(@PathVariable UUID projectId) {
        ProjectEntity project = projectService.getProjectById(projectId);
        return ResponseEntity.ok(project);
    }

    @PutMapping("/{projectId}")
    public ResponseEntity<ProjectEntity> updateProject(
            @PathVariable UUID projectId,
            @RequestBody Map<String, String> request) {
        ProjectEntity project = projectService.updateProject(
                projectId,
                request.get("name"),
                request.get("description")
        );
        return ResponseEntity.ok(project);
    }

    @DeleteMapping("/{projectId}")
    public ResponseEntity<Void> deleteProject(@PathVariable UUID projectId) {
        projectService.deleteProject(projectId);
        return ResponseEntity.noContent().build();
    }
}
