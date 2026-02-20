export interface TestNameProps {
	testname: string;
}

export interface VersionsProps extends TestNameProps {
	versions: string[];
}

export interface VersionProps extends TestNameProps {
	version: string;
}
