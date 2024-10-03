export class RegisterFormBuilder {
	constructor() {
		this.registerObj = {
			name: "test123",
			email: "test123@example.com",
			password: "password123",
			phone: "123123123",
			address: "Blk 123",
			DOB: "2000-01-01",
			answer: "123"
		}
	}
	
	withName(name) {
		this.registerObj.name = name
		return this
	}
	
	withEmail(email) {
		this.registerObj.email = email
		return this
	}
	
	withPhone(phone) {
		this.registerObj.phone = phone
		return this
	}
	
	withAddress(address) {
		this.registerObj.address = address
		return this
	}
	
	withAnswer(answer) {
		this.registerObj.answer = answer
		return this
	}
	
	withPassword(password) {
		this.registerObj.password = password
		return this
	}
	
	withDOB(dob) {
		this.registerObj.DOB = dob
		return this
	}
	
	build() {
		return this.registerObj
	}
}