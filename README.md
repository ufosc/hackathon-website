<div align="center">
<h1>hackathon-website</h1>

<!-- <img src="https://github.com/user-attachments/assets/69302e62-b454-4a84-906e-3a176fa347f3" width="100%" height="90%" /> -->

Website for the UF Open Source Club Minihack.

September 2025 
</div>

## Install
Clone the repository (requires [git](https://git-scm.com/)):
```
git clone https://github.com/ufosc/hackathon-website.git
```

Navigate to the project directory and install the project dependencies (requires [Node.js](https://nodejs.org/en)):
```
cd hackathon-website
npm install --force
```
## Usage
<b>Starting the development server:</b>
```
npm run dev
```
You may access the website at http://localhost:3000


For GitHub Pages, add these as repository secrets and expose them in your build.

<b>Publishing to GitHub Pages</b>

To publish to GitHub pages, make sure that your account has permission to push directly to the repository's branches (i.e. you've been invited as a contributor). Then, run the following command to build and deploy the website:
```
npm run build-and-deploy
```
When the website is deployed, GitHub tends to automatically change the website's domain. If this occurs, navigate to `Settings > Pages` and set the custom domain to `hack.ufosc.org`.

## License
[AGPL-3.0-or-later](LICENSE) <br/>
Copyright (C) 2025 Open Source Club
