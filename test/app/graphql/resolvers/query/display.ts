import ava, { TestInterface } from 'ava';
import display from '../../../../../app/graphql/resolvers/query/display';

const test = ava as TestInterface<{
    apiKey: string;
}>;

test.beforeEach(async t => {
    t.context.apiKey = 'TEST_TEST_TEST_TEST_TEST_TEST_TEST_TEST_TEST_TEST_TEST_TEST_TEST';
});

test('icons', async t => {
    const result = await display();

    // Check base64 seperately
    const { base64, ...rest } = result.case;

    t.regex(base64, new RegExp('^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$'));
    t.deepEqual(rest, {
        url: 'case-model.png',
        icon: 'custom',
        error: ''
    });
});