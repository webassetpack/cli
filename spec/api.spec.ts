
import * as api from '../src/api';
import {Packer} from '../src/Packer';

describe('Public API', () => {
    it('Packer', () => {
        expect(api.Packer).toBe(Packer);
    });
});
