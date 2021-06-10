/*
import chai from 'chai';
import chaiHttp from 'chai-http';

import config from '../src/config';
import * as db from '../src/_helpers/db';
import app from '../src/app';

const should = chai.should();
chai.use(chaiHttp);

describe('Users', () => {
  beforeEach((done) => {
    db.User.remove({}, (err) => {
      done();
    });
  });

  describe('/GET /', () => {
    it('should GET the homepage', (done) => {
      chai
        .request(app)
        .get('/')
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });
  });
});
*/
