The GoodGifts API provides all the functionability for the [Web Application](https://goodgifts.gabodev.com/login).

You can also visit the Next.js web application and the microservices architecture:

- [Boira-microservices-v1](https://github.com/Gguardiola/Boira-Microservices-v1)
- [GoodGifts Web Application](https://github.com/Gguardiola/goodgifts-nextjs-app)

## What is GoodGifts API?

GoodGifts is a web application where you can have wishlists with items that you want for your birthday, Christmas or any other kind of event involving gifts.

You can also view other people's wishlists in case you want to get inspiration for gift ideas, add your friends, and the most important feature: create gifts that everyone except the beneficiary can see. With this feature, other friend can avoid giving the same gift or in case that it's an expensive one, they can send an implication request to collaborate in the same gift.

To sumarize, this API can register new users, login users, logout users (secured with JWT token authentication), find, update and delete user profiles. Check, add and delete friends. Create, delete and edit wishlists. Find, create, delete, and edit items (to later add them to wishlists or gifts). And finally find, create, delete, complete and implicate other users to an existing gift.

## Microservices architecture diagram (Boira v1)

<img src="https://content.pstmn.io/d120c632-cb99-4d02-9c2d-c0091865102e/Qm9pcmFNaWNyb3NlcnZpY2VzRGlhZ3JhbS12MS5wbmc=">

## Getting started guide

To start using GoodGifts API:

- If you are using this API locally, the endpoint is `http://localhost:5000/goodgifts` and the oficial production/testing stage endpoint is `https://api.gabodev.com/goodgifts` . This means that the API will only respond HTTPS-secured communications. To clarify, the objective of this endpoint is to be deactivated once the development stage is finished and be accessible only from the internal communication streams.
- Some API calls have **usage limits**. For example, the signup and the login **are limited to 100 requests within a range of 15 minutes from the same device**, avoiding bots from attacking the service.
- The API returns request responses in JSON format. When an API request is successfully completed, it will return an HTTP `200` response with a `success: true` field followed by the requested information if required. Otherwise, the JSON response will be `success: false` followed by `message: {error}` .
- Every call will contain an `Authentication` header with the user token previously provided by the login.
    

## Authentication

As mentioned earlier, the GoodGifts API uses `Authentication` header for authentication.

Once the user successfully login, the auth service will provide a JWT token that will be valid for 48 hours or until the user logs out. The token has the user id encrypted that will be checked using a middleware on every API call (see the microservices diagram above).

### Authentication error response

If an authentication token is missing, malformed, or invalid, you will receive an HTTP 401 Unauthorized response code.

## Common HTTP responses

Depending of the request the API will respond with an specific code. These are the most common ones:

| HTTP response | Description |
| --- | --- |
| `200` | The request was successful |
| `400` | Bad Request. Some of the params were incorrectly formatted or missing. |
| `401` | Unauthorized. The token is missing or invalid. Check the `Authentication` header.  <br>  <br>Also some API calls check if the user id encrypted in the token and the `userId: {uuid}` are the same for security reasons. |
| `404` | Not Found. One of the provided params are not found in the database. For example, `userId` , `itemId` or `giftId` . |
| `409` | Already Exists. One of the params provided already exists. |
| `429` | Too many requests from this IP, please try again later. |
| `500` | Internal Server Error. Unhandled error happened inside the server. |

## API routes

You can view all the routes, examples, requests and responses in the [Postman API documentation](https://documenter.getpostman.com/view/31354348/2s9YsFFZtQ).


