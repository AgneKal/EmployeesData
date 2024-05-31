import mysql from 'mysql2';
import http from 'http';
import { Employee } from './models/empoyee';
import fs from 'fs';
import path from 'path';


let connected = false;

const connection = mysql.createConnection (`mysql://root:labasrytas@localhost:3306/company`);

connection.connect((error: any) => {
    if(error) throw error;
    connected = true;
})

const server = http.createServer((req, res) => {
    const url = req.url;
    const method = req.method;

    let filePath = `public${url}`;

        
    if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
        const ext = path.extname(filePath);
        switch(ext) {
            case ".css":
                res.setHeader('Content-Type', 'text/css');
                break;
            case ".jpg":
            case ".jpeg":
            case ".png":
                res.setHeader('Content-Type', 'image/jpg');
                break;
            case ".js":
                res.setHeader('Content-Type', 'applications/javascript');
                break;
        }
        //default padaryti
        
        let file = fs.readFileSync(filePath);
        res.write(file);
        return res.end();
    }   

    if(url === '/employees' && method === 'GET') {
        if(connected) {
            connection.query<Employee[]>('SELECT * FROM company.employees', (error, result) => {
                if(error) throw error;
                res.setHeader("Content-Type", "text/html; charset = utf-8");
                let rows = "";
                result.forEach((e) => {
                    rows+="<tr>";
                    rows+=`<td>${e.name}</td> <td>${e.surname}</td> <td>${e.phone}</td> <td> <a href='/employee/${e.id}' class="btn btn-success">Plačiau</a><a href='/delete/${e.id}' class="btn btn-danger">Ištinti</a></td>`;
                    rows+="</tr>";
                });
                let template = fs.readFileSync('templates/employees.html').toString();
                template = template.replace('{{ employees_table }}', rows)
                res.write(template);
                res.end();
            });
        }
    }

    if(url?.split('/')[1] === 'employee') {
        let id = parseInt(url?.split('/')[2]);
        connection.query<Employee[]>(`SELECT * FROM company.employees WHERE id=${id}`, (error, result) => {
                if(error) throw error;
                let employee = result[0];
                res.setHeader("Content-Type", "text/html; charset = utf-8");
                
                let template = fs.readFileSync('templates/employee.html').toString();
                template = template.replace("{{ name }}", employee.name);
                template = template.replace("{{ surname }}", employee.surname);
                template = template.replace("{{ phone }}", employee.phone != null ? employee.phone : '-');
                template = template.replace("{{ gender }}", employee.gender != null ? employee.gender : '-');
                template = template.replace("{{ birthday }}", employee.birthday != null ? employee.birthday.toLocaleDateString('lt-LT') : '-');
                template = template.replace("{{ education }}", employee.education != null ? employee.education : '-');
                template = template.replace("{{ salary }}", employee.salary != null ? employee.salary : '-');
        
                res.write(template);
                res.end();
            });
    }

    if(url === '/addEmployee' && method === 'POST') {
        if(connected){
            const reqBody: any[] = [];
            req.on('data', (d) => {
                reqBody.push(d);
            });
            req.on('end', () => {
                const reqData = decodeURIComponent(Buffer.concat(reqBody).toString());
                const dd = reqData.split('&');
                const name = mysql.escape(dd[0].split('=')[1]);
                const surname = mysql.escape(dd[1].split('=')[1]);
                const gender = mysql.escape(dd[2].split('=')[1]);
                const phone = mysql.escape(dd[3].split('=')[1]);
                const birthday = mysql.escape(dd[4].split('=')[1]);
                const education = mysql.escape(dd[5].split('=')[1]);
                const salary = mysql.escape(dd[6].split('=')[1]);
                const sql = `INSERT INTO employees(name, surname, gender, phone, birthday, education, salary) VALUES (${name}, ${surname}, ${gender}, ${phone}, ${birthday}, ${education}, ${salary})`;
                connection.query(sql, (error) => {
                    if(error) throw error;
                });
                res.writeHead(302, {
                    location: '/employees',
                });
                res.end();
            })
        }
    }

    if(url === '/addEmployee' && method === 'GET') {
        if(connected){
            const template = fs.readFileSync('templates/addEmployee.html').toString();
            res.write(template);
            res.end();
        }
    }

    if(url?.split('/')[1] === 'delete') {
        const id = parseInt(url?.split('/')[2]);
        connection.query<Employee[]>(`DELETE FROM employees WHERE id=${id}`, (error) => {
            if(error) throw error;
            res.writeHead(302, {
                location: '/employees',
            });
            res.end();
        });
    }

});

server.listen(2999, 'localhost')