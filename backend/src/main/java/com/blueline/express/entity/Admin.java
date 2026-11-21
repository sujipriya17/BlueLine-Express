package com.blueline.express.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "admins")
@PrimaryKeyJoinColumn(name = "user_id")
public class Admin extends User {

    @Column(nullable = false, length = 80)
    private String department = "Fleet Operations";

    public Admin() {
        setRole("ADMIN");
    }

    @Override
    public String getAccountSummary() {
        return String.format("Admin[%s, Dept=%s]", getFullName(), department);
    }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
}
