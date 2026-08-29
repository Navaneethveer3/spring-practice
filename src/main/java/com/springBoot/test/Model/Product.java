package com.springBoot.test.Model;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Product implements Serializable {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;
	private Integer price;
	private String name;
	
	@Column(length = 1000)
	private String description;
	private String brand;
	private LocalDate launchDate;
	private String imageName;
	private String imageType;
	private Integer quantity;
	
	@JsonIgnore
	@OneToMany(cascade = CascadeType.ALL, mappedBy = "product", fetch = FetchType.LAZY)
	private List<OrderItem> item;
	
	@JsonIgnore
	@OneToMany(cascade = CascadeType.ALL, mappedBy = "product", fetch = FetchType.LAZY)
	private List<Review> reviews;
	
	@Lob
	private byte[] imageData;
	
	@Column(unique = true)
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID version;
	
	public Integer getId() {
		return id;
	}
	public void setId(Integer id) {
		this.id = id;
	}
	public Integer getPrice() {
		return price;
	}
	public void setPrice(Integer price) {
		this.price = price;
	}
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public String getImageName() {
		return imageName;
	}
	public void setImageName(String imageName) {
		this.imageName = imageName;
	}
	public String getImageType() {
		return imageType;
	}
	public void setImageType(String imageType) {
		this.imageType = imageType;
	}
	public byte[] getImageData() {
		return imageData;
	}
	public void setImageData(byte[] imageData) {
		this.imageData = imageData;
	}
	public String getBrand() {
		return brand;
	}
	public void setBrand(String brand) {
		this.brand = brand;
	}
	public LocalDate getLaunchDate() {
		return launchDate;
	}
	public void setLaunchDate(LocalDate launchDate) {
		this.launchDate = launchDate;
	}
	public String getDescription() {
		return description;
	}
	public void setDescription(String description) {
		this.description = description;
	}
	public Integer getQuantity() {
		return quantity;
	}
	public void setQuantity(Integer quantity) {
		this.quantity = quantity;
	}
	public List<OrderItem> getItem() {
		return item;
	}
	public void setItem(List<OrderItem> item) {
		this.item = item;
	}
	public List<Review> getReviews() {
		return reviews;
	}
	public void setReviews(List<Review> reviews) {
		this.reviews = reviews;
	}
	public UUID getVersion() {
		return version;
	}
	public void setVersion(UUID version) {
		this.version = version;
	}
	
	
	
}
