package com.benchmark.app1.model;

import javax.persistence.*;

@Entity
@Table(name = "work_items")
public class WorkItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String payload;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

    public WorkItem() {}

    public WorkItem(String payload) {
        this.payload = payload;
        this.createdAt = java.time.LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getPayload() { return payload; }
    public java.time.LocalDateTime getCreatedAt() { return createdAt; }
}
