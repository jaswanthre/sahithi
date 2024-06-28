const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
 
const bcrypt = require('bcrypt'); // https://www.npmjs.com/package/bcrypt npm i bcrypt
var jwt = require('jsonwebtoken'); //https://github.com/auth0/node-jsonwebtoken npm install jsonwebtoken
 
const app = express();
const port = 3001
 
app.use(express.json());
app.use(cors());
const con1 = mysql.createConnection({
    user: 'root',
    host: 'localhost',
    password: '',
    database: 'janu'
  });
  con1.connect(function(err) {
    if (err) {
      console.log('Error in Connection');
    } else {
      console.log('Connected');
    }
  });
const con = mysql.createConnection({
    user: "root",
    host: "localhost",
    password: "",
    database: "nodejsdb"
})

con.connect(function(err) {
    if(err) {
        console.log("Error in Connection");
    } else {
        console.log("Connected");
    }
})

app.get('/getEmployee', (req, res) => {
    const sql = "SELECT * FROM employee";
    con.query(sql, (err, result) => {
        if(err) return res.json({Error: "Get employee error in sql"});
        return res.json({Status: "Success", Result: result})
    })
})
 
app.get('/get/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM employee where id = ?";
    con.query(sql, [id], (err, result) => {
        if(err) return res.json({Error: "Get employee error in sql"});
        return res.json({Status: "Success", Result: result})
    })
})
 
app.put("/update/:id", (req, res) => {
  const userId = req.params.id;
  const q = "UPDATE employee SET name= ?, email= ?, password= ?, address= ? WHERE id = ?";
  
  const values = [
    req.body.name,
    req.body.email,
    req.body.password,
    req.body.address,
  ];
  
  con.query(q, [...values,userId], (err, data) => {
    if (err) return res.send(err);
    return res.json(data);
    //return res.json({Status: "Success"})
  });
});
 
app.delete('/delete/:id', (req, res) => {
    const id = req.params.id;
    const sql = "Delete FROM employee WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if(err) return res.json({Error: "delete employee error in sql"});
        return res.json({Status: "Success"})
    })
})
 
app.get('/adminCount', (req, res) => {
    const sql = "Select count(id) as admin from users";
    con.query(sql, (err, result) => {
        if(err) return res.json({Error: "Error in runnig query"});
        return res.json(result);
    })
})
 
app.get('/employeeCount', (req, res) => {
    const sql = "Select count(id) as employee from employee";
    con.query(sql, (err, result) => {
        if(err) return res.json({Error: "Error in runnig query"});
        return res.json(result);
    })
})
 

app.post('/create', (req, res) => {
    const id = req.body.id;
    const name = req.body.name;
    const email = req.body.email;
    const address = req.body.address;
    const password = req.body.password;
  
    con.query("INSERT INTO employee (id,name, email, address, password) VALUES (?,?, ?, ?, ?)", [id,name, email, address, password], 
        (err, result) => {
            if(result){
                res.send(result);
            }else{
                res.send({message: "ENTER CORRECT DETAILS!"})
            }
        }
    )
})
 
app.get('/hash', (req, res) => { 
    bcrypt.hash("123456", 10, (err, hash) => {
        if(err) return res.json({Error: "Error in hashing password"});
        const values = [
            hash
        ]
        return res.json({result: hash});
    } )
})
 
app.post('/loginuser', (req, res) => {
    const sql = "SELECT * FROM employee WHERE email = ?";
    con.query(sql, [req.body.email], (err, result) => {
        if (err) {
            return res.json({ Status: "Error", Error: "Error in running query" });
        }
        if (result.length > 0) {
            if (req.body.password.toString() === result[0].password.toString()) {
                const token = jwt.sign({ role: "employee" }, "jwt-secret-key", { expiresIn: '1d' });
                return res.json({ Status: "Success", Token: token });
            } else {
                return res.json({ Status: "Error", Error: "Wrong Email or Password" });
            }
        } else {
            return res.json({ Status: "Error", Error: "Wrong Email or Password" });
        }
    });
})
 
app.post('/loginadmin', (req, res) => {
    const sql = "SELECT * FROM users Where email = ?";
    con.query(sql, [req.body.email], (err, result) => {
        if(err) return res.json({Status: "Error", Error: "Error in runnig query"});
        if(result.length > 0) {
            bcrypt.compare(req.body.password.toString(), result[0].Password, (err, response)=> {
                if(err) return res.json({Error: "password error"});
                if(response) {
                    const token = jwt.sign({role: "employee"}, "jwt-secret-key", {expiresIn: '1d'});
                    return res.json({Status: "Success", Token: token})
                } else {
                    return res.json({Status: "Error", Error: "Wrong Email or Password"});
                }
            })
        } else {
            return res.json({Status: "Error", Error: "Wrong Email or Password"});
        }
    })
});
app.post('/register',(req, res) => {
    const sql = "INSERT INTO users (name,email,password) VALUES (?)"; 
    bcrypt.hash(req.body.password.toString(), 10, (err, hash) => {
        if(err) return res.json({Error: "Error in hashing password"});
        const values = [
            req.body.name,
            req.body.email,
            hash,
        ]
        con.query(sql, [values], (err, result) => {
            if(err) return res.json({Error: "Error query"});
            return res.json({Status: "Success"});
        })
    } )
})
let logs = [];

// Add a new time log
app.post('/logs', (req, res) => {
  const log = { id: logs.length + 1, ...req.body, duration: calculateDuration(req.body.start_time, req.body.end_time) };
  logs.push(log);
  res.status(201).send(log);
});

// Get today's summary
app.get('/summary/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter(log => log.date === today);
  const totalHours = todayLogs.reduce((sum, log) => sum + log.duration, 0);
  const breakdown = todayLogs.reduce((acc, log) => {
    acc[log.topic] = (acc[log.topic] || 0) + log.duration;
    return acc;
  }, {});

  res.send({ totalHours, breakdown });
});

// Add or update a work entry
app.post('/create1', (req, res) => {
    const { id, date, topic_project, start_time, end_time, description } = req.body;
  
    if (!id || !date || !topic_project || !start_time || !end_time || !description) {
      return res.status(400).json({ message: 'All fields are required' });
    }
  
    const checkIdQuery = 'SELECT 1 FROM nodejsdb.employee WHERE id = ?';
  
    con1.query(checkIdQuery, [id], (err, results) => {
      if (err) {
        console.error('Database error: ', err);
        return res.status(500).json({ message: 'Database error, please check your input' });
      }
  
      if (results.length === 0) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
  
      const total_duration = calculateDuration(start_time, end_time);
      const query = `
        INSERT INTO managework (id, date, topic_project, start_time, end_time, description, total_duration) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            date = VALUES(date), 
            topic_project = VALUES(topic_project), 
            start_time = VALUES(start_time), 
            end_time = VALUES(end_time), 
            description = VALUES(description), 
            total_duration = VALUES(total_duration)
      `;
      const values = [id, date, topic_project, start_time, end_time, description, total_duration];
      console.log(values);
  
      con1.query(query, values, (err, result) => {
        if (err) {
          console.error('Database error: ', err);
          return res.status(500).json({ message: 'Database error, please check your input' });
        }
        res.status(201).json({ message: 'Work created successfully', result });
      });
    });
  });

// Get all logs
app.get('/logs', (req, res) => {
  con.query('SELECT * FROM managework', (err, result) => {
    if (err) {
      console.error('Database error: ', err);
      return res.status(500).json({ message: 'Database error, could not retrieve logs' });
    }
    res.status(200).json(result);
  });
});

// Calculate duration in minutes
function calculateDuration(start_time, end_time) {
  const start = new Date(`1970-01-01T${start_time}Z`);
  const end = new Date(`1970-01-01T${end_time}Z`);
  const diff = (end - start) / (1000 * 60);
  return diff; // returning total minutes
}

// Get progress data
app.get('/progress', (req, res) => {
  const query = `
    SELECT id, topic_project, SUM(total_duration) AS total_minutes
    FROM janu.managework
    GROUP BY id, topic_project
  `;

  con.query(query, (err, result) => {
    if (err) {
      console.error('Database error: ', err);
      return res.status(500).json({ message: 'Database error, could not retrieve progress data', error: err.message });
    }
    const data = result.map(row => {
      const total_minutes = row.total_minutes;
      const total_hours = Math.floor(total_minutes / 60);
      const remaining_minutes = total_minutes % 60;
      return {
        id: row.id,
        topic_project: row.topic_project,
        total_hours,
        total_minutes: remaining_minutes
      };
    });
    res.status(200).json(data);
  });
});

// Delete a log entry
app.delete('/logs/:entry_id', (req, res) => {
  const { entry_id } = req.params;

  const query = 'DELETE FROM managework WHERE entry_id = ?';
  con.query(query, [entry_id], (err, result) => {
    if (err) {
      console.error('Database error: ', err);
      return res.status(500).json({ message: 'Database error, could not delete log' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Log not found' });
    }
    res.status(200).json({ message: 'Log deleted successfully' });
  });
});

app.listen(port, () => {
  console.log('Example app listening on port ${port}')
})