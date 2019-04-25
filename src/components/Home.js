import React from 'react'
import Button from 'react-bootstrap/Button'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'
import Badge from 'react-bootstrap/Badge'
import Alert from 'react-bootstrap/Alert'
import Spinner from 'react-bootstrap/Spinner'
import {CometChat} from '@cometchat-pro/chat'
import {Redirect} from 'react-router-dom'

class Home extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			username: "",
			user: null,
			defaultUsernames: ['SUPERHERO1', 'SUPERHERO2', 'SUPERHERO3', 'SUPERHERO4', 'SUPERHERO5'],
			error: null,
			redirect: false,
			isLoading: false
		}
	}

	handleChange = e => {
		this.setState({username: e.target.value})
	}

	handleSubmit = e => {
		e.preventDefault()
		const username = this.state.username
		this.setState({username: "", isLoading: true})

		CometChat
			.login(username, process.env.REACT_APP_COMETCHAT_APIKEY)
			.then(user => this.setState({redirect: true, user, isLoading: false}))
			.catch(err => {
				this.setState({error: err.message, isLoading: false})	
			})
	}

	render() {
		if(this.state.redirect) return <Redirect to={{
			pathname: '/chat',
			user: this.state.user
	}} />

		return(
			<React.Fragment>
				<Row 
					className="d-flex justify-content-center align-items-center w-100 mt-5"
					style={{
						minHeight: "100%"
					}}>
					<Col xs={10} sm={10} md={4} lg={4} className="mx-auto mt-5">
						{this.state.error !== null && (<Alert variant="danger">
							{this.state.error}
						</Alert>)}
						<Form onSubmit={this.handleSubmit}>
							<Form.Group controlId="username">
								<Form.Label>Username</Form.Label>
								<Form.Control required type="text" value={this.state.username} placeholder="Enter a Username" onChange={this.handleChange} />
							</Form.Group>
							<Button disabled={this.state.isLoading} variant="primary" type="submit" className="btn-block">
								{this.state.isLoading ? (
									<>
										<Spinner
											as="span"
											animation="grow"
											size="sm"
											role="status"
											aria-hidden="true"
										/>
										Loading...
									</>
								) : (<span>Join</span>)}
							</Button>
						</Form>
						<p className="text-center lead mt-5">Available Usernames</p>
						{this.state.defaultUsernames.map(username => (
							<Badge variant="primary" className="mx-2" key={username}>{username}</Badge>
						))}
					</Col>
				</Row>
			</React.Fragment>
		)
	}
}

export default Home