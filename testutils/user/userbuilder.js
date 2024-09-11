export class UserBuilder {
	constructor() {
		this.userObj = {
			_id: "123123",
			name: "Test USer 123",
			email: 'test123@example.com',
			phone: '90000123',
			address: 'Test Address 345',
			answer: 'Test answer',
			password: 'password',
			role: "test role"
		}
	}
	withName(name) {
		this.userObj.name = name
		return this
	}
	
	withEmail(email) {
		this.userObj.email = email
		return this
	}
	
	withPhone(phone) {
		this.userObj.phone = phone
		return this
	}
	
	withAddress(address) {
		this.userObj.address = address
		return this
	}
	
	withAnswer(answer) {
		this.userObj.answer = answer
		return this
	}
	
	withPassword(password) {
		this.userObj.password = password
		return this
	}
	
	withRole(role) {
		this.userObj.role = role
		return this
	}
	
	build() {
		return this.userObj
	}
}