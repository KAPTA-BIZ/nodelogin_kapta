# Results Classmarker tests

Implementation of one platform oriented to retrieve and handle the results of (Classmarker)[https://classmarker.com] tests. The idea behind this project is to connect and make easier for the consultants the way of visualize its evaluations.

This project is composed of the follow technologies:

- NodeJS
- Express
- EJS - (HTML server side)

The path is constituited by:
  |
  |- node_modules
  |- src
      |
      |- app -> Here are the models and routes
      |- classmarker -> The config files to connect with Classmarker API and Webhooks
      |- config -> Contains the passport configurations
      |- public -> Contains the assets (img/video/fonts)
      |- views -> It has the EJS files and the visualization of the platform

## Contribute

1. Clone or download the project.
2. Make sure that you have `Node v8.9.4` and `npm v5.6.0`.
2. Inside your terminal, go to the project's path.
3. Run ``` npm install ```
4. Run ``` npm start ```

The project is launched in the server with the port 3001.

Open your browser and type: ``` http://localhost:3001 ```

## Database

The database is a NonSQL DB used with Mongoose and mLab(https://mlab.com). It was used due is one of the best trusted platform to handle all the information. It is splitted by the follow collections.

- userschema
- linkschema
- groupschema
- aschemas
- categories
- hookschemas
- testsschemas
- pruebascollection
- users

Where the information is storaged and handled. 

## Deploy

This project is deployed to the (Heroku)[https://heroku.com] platform as a service. Where the server storage and launch all the application. 

## Team

Project created and developed by @camiloibarrak and @kmiloarguello

## Copyright

All the code, rights and platform are property of K@PTA.